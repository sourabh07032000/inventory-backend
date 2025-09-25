const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const Customer = require("../models/Customer");

// ✅ 1. Dashboard Stats
router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Total Stock Value (cost * stock)
    const stockAgg = await Product.aggregate([
      { $match: { wholesaler: userId } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } }
    ]);
    const totalStockValue = stockAgg.length > 0 ? stockAgg[0].totalValue : 0;

    // Today's Sales
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaySales = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay }, "supplier.supplierId": userId } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);
    const todaysSales = todaySales.length > 0 ? todaySales[0].total : 0;

    // Monthly Revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, "supplier.supplierId": userId } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } }
    ]);
    const monthRevenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;

    // For now, monthly profit = revenue * 0.25 (fake calc, can be improved later)
    const monthlyProfit = monthRevenue * 0.25;

    res.json([
      {
        title: "Total Stock Value",
        value: totalStockValue.toFixed(2),
        change: "+5%", // Placeholder
        trend: "up",
        icon: "package",
        description: "from last month"
      },
      {
        title: "Today's Sales",
        value: todaysSales.toFixed(2),
        change: "+10%",
        trend: "up",
        icon: "dollar",
        description: "from yesterday"
      },
      {
        title: "Monthly Revenue",
        value: monthRevenue.toFixed(2),
        change: "+12%",
        trend: "up",
        icon: "trending",
        description: "from last month"
      },
      {
        title: "Monthly Profit",
        value: monthlyProfit.toFixed(2),
        change: "-3%",
        trend: "down",
        icon: "dollar",
        description: "from last month"
      }
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
    const transactions = await Order.find({ "supplier.supplierId": userId })
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
    const products = await Product.find({ wholesaler: userId, stock: { $lt: 10 } }).limit(10);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
