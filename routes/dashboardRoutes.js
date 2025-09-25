const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const Customer = require("../models/Customer");

// ✅ 1. Dashboard Stats
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // --- Total Stock Value ---
    const stockAgg = await Product.aggregate([
      { $match: { wholesaler: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
        },
      },
    ]);
    const totalStockValue = stockAgg.length > 0 ? stockAgg[0].totalValue : 0;

    // --- Today's Sales ---
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const todaySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay },
          wholesaler: new mongoose.Types.ObjectId(userId),
        },
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const todaysSales = todaySalesAgg.length > 0 ? todaySalesAgg[0].total : 0;

    const yesterdaySalesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYesterday, $lt: startOfDay },
          wholesaler: new mongoose.Types.ObjectId(userId),
        },
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const yesterdaysSales =
      yesterdaySalesAgg.length > 0 ? yesterdaySalesAgg[0].total : 0;

    const todaysChange =
      yesterdaysSales > 0
        ? (((todaysSales - yesterdaysSales) / yesterdaysSales) * 100).toFixed(2)
        : 0;

    // --- Monthly Revenue ---
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const monthlyRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          wholesaler: new mongoose.Types.ObjectId(userId),
        },
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const monthRevenue =
      monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0;

    const lastMonthRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
          wholesaler: new mongoose.Types.ObjectId(userId),
        },
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const lastMonthRevenue =
      lastMonthRevenueAgg.length > 0 ? lastMonthRevenueAgg[0].total : 0;

    const monthChange =
      lastMonthRevenue > 0
        ? (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(
            2
          )
        : 0;

    // --- Monthly Profit (Revenue - Cost) ---
    const monthlyCostAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          wholesaler: new mongoose.Types.ObjectId(userId),
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $group: {
          _id: null,
          totalCost: {
            $sum: { $multiply: ["$products.quantity", "$productData.costPrice"] },
          },
        },
      },
    ]);
    const monthlyCost =
      monthlyCostAgg.length > 0 ? monthlyCostAgg[0].totalCost : 0;
    const monthlyProfit = monthRevenue - monthlyCost;

    // (Last Month Profit)
    const lastMonthCostAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
          wholesaler: new mongoose.Types.ObjectId(userId),
        },
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productData",
        },
      },
      { $unwind: "$productData" },
      {
        $group: {
          _id: null,
          totalCost: {
            $sum: { $multiply: ["$products.quantity", "$productData.costPrice"] },
          },
        },
      },
    ]);
    const lastMonthCost =
      lastMonthCostAgg.length > 0 ? lastMonthCostAgg[0].totalCost : 0;
    const lastMonthProfit = lastMonthRevenue - lastMonthCost;

    const profitChange =
      lastMonthProfit > 0
        ? (((monthlyProfit - lastMonthProfit) / lastMonthProfit) * 100).toFixed(
            2
          )
        : 0;

    res.json([
      {
        title: "Total Stock Value",
        value: totalStockValue.toFixed(2),
        change: "+0%", // Stock value comparison can be added later
        trend: "up",
        icon: "package",
        description: "from last month",
      },
      {
        title: "Today's Sales",
        value: todaysSales.toFixed(2),
        change: `${todaysChange}%`,
        trend: todaysChange >= 0 ? "up" : "down",
        icon: "dollar",
        description: "vs yesterday",
      },
      {
        title: "Monthly Revenue",
        value: monthRevenue.toFixed(2),
        change: `${monthChange}%`,
        trend: monthChange >= 0 ? "up" : "down",
        icon: "trending",
        description: "vs last month",
      },
      {
        title: "Monthly Profit",
        value: monthlyProfit.toFixed(2),
        change: `${profitChange}%`,
        trend: profitChange >= 0 ? "up" : "down",
        icon: "dollar",
        description: "vs last month",
      },
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});


// ✅ 2. Recent Transactions
router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await Order.find({ wholesaler: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ 3. Low Stock Alerts
router.get("/low-stock/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const products = await Product.find({ wholesaler: userId, quantity: { $lt: 10 } }).limit(10);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
