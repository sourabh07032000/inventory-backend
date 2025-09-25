const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");

// Utility to calculate start date based on period
const getStartDate = (period) => {
  const now = new Date();
  switch (period) {
    case "1days":
      now.setDate(now.getDate() - 1);
      break;
    case "7days":
      now.setDate(now.getDate() - 7);
      break;
    case "30days":
      now.setDate(now.getDate() - 30);
      break;
    case "90days":
      now.setDate(now.getDate() - 90);
      break;
    case "1year":
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      now.setDate(now.getDate() - 7);
  }
  now.setHours(0, 0, 0, 0);
  return now;
};

// 1️⃣ Summary Stats
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const period = req.query.period || "7days";
    const startDate = getStartDate(period);

    // Total Revenue
    const revenueAgg = await Order.aggregate([
      { $match: { wholesaler: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
      { $group: { _id: null, totalRevenue: { $sum: "$grandTotal" }, totalOrders: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalOrders = revenueAgg[0]?.totalOrders || 0;
    const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;

    // Total Profit (sum of order grandTotal - costPrice*quantity)
    const orders = await Order.find({ wholesaler: userId, createdAt: { $gte: startDate } }).populate("products.productId");
    let totalProfit = 0;
    orders.forEach(order => {
      order.products.forEach(p => {
        const cost = p.productId?.costPrice || 0;
        totalProfit += (p.totalPrice - cost * p.quantity);
      });
    });
    const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

    res.json([
      { title: "Total Revenue", value: totalRevenue, change: "+0%", trend: "up" },
      { title: "Total Sales", value: totalOrders, change: "+0%", trend: "up" },
      { title: "Average Order", value: avgOrder, change: "+0%", trend: "up" },
      { title: "Profit Margin", value: profitMargin.toFixed(2), change: "+0%", trend: "up" }
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// 2️⃣ Top Products
router.get("/top-products/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const period = req.query.period || "7days";
    const startDate = getStartDate(period);

    const topProducts = await Order.aggregate([
      { $match: { wholesaler: new mongoose.Types.ObjectId(userId), createdAt: { $gte: startDate } } },
      { $unwind: "$products" },
      { $group: {
          _id: "$products.productName",
          sales: { $sum: "$products.quantity" },
          revenue: { $sum: "$products.totalPrice" }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    res.json(topProducts.map(p => ({
      name: p._id,
      sales: p.sales,
      revenue: p.revenue
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// 3️⃣ Sales Overview (for chart)
router.get("/sales-overview/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const period = req.query.period || "7days";
    const startDate = getStartDate(period);

    const salesData = await Order.aggregate([
      {
        $match: {
          wholesaler: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          dailyRevenue: {
            $sum: {
              $multiply: ["$products.quantity", "$productDetails.sellingPrice"],
            },
          },
          dailySales: { $sum: "$products.quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      salesData.map((d) => ({
        date: d._id,
        sales: d.dailySales,
        revenue: d.dailyRevenue,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});


// 4️⃣ Revenue vs Cost (for chart)
router.get("/revenue-cost/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const period = req.query.period || "7days";
    const startDate = getStartDate(period);

    const orders = await Order.find({
      wholesaler: userId,
      createdAt: { $gte: startDate },
    }).populate("products.productId");

    const chartDataMap = {};

    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      if (!chartDataMap[dateKey]) {
        chartDataMap[dateKey] = { revenue: 0, cost: 0 };
      }

      order.products.forEach((p) => {
        const sellingPrice = p.productId?.sellingPrice || 0;
        const costPrice = p.productId?.costPrice || 0;

        chartDataMap[dateKey].revenue += sellingPrice * p.quantity;
        chartDataMap[dateKey].cost += costPrice * p.quantity;
      });
    });

    const chartData = Object.keys(chartDataMap)
      .sort()
      .map((date) => ({
        date,
        revenue: chartDataMap[date].revenue,
        cost: chartDataMap[date].cost,
      }));

    res.json(chartData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});


module.exports = router;
