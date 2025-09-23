const express = require("express");
const Order = require("../models/Order");
const Customer = require('../models/Customer')
const router = express.Router();

// Only superadmin/admin can create wholesaler
router.post("/create-order", async(req, res)=>{
    
    try {
      console.log(req.body)
    const oldCustomer = await Customer.findOne({phone : req.body.customerPhone})
    if(!oldCustomer){
        const newCustomer = new Customer({
            name : req.body.customerName,
            phone : req.body.customerPhone,
            wholesaler: req.body.wholesaler
        })
        await newCustomer.save()
    }
    const {
      billNumber,
      date,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      discountAmount,
      gstRate,
      gstAmount,
      total,
      paymentMode,
      paymentType,
      dueDate,
      wholesaler
    } = req.body;

    // validations
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).json({ message: "Customer and items are required" });
    }

    // Auto-generate orderNumber if frontend didn’t pass
    const orderNumber = billNumber || (await generateOrderNumber());

    // Transform items into products format expected by Order model
    const products = items.map((item) => ({
      productId: item._id, // coming from cart
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
      unit : item.unit
    }));

    // Save into DB
    const newOrder = new Order({
      orderNumber,
      customerName,
      customerPhone,
      customerAddress: "", // optional, can extend later
      products,
      subtotal,
      discount: discount || 0,
      tax: gstAmount || 0,
      grandTotal: total,
      paymentMethod: paymentMode || "cash",
      paymentStatus: paymentType === "immediate" ? "paid" : "pending",
      orderStatus: "pending",
      wholesaler
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error", error });
  }

});



router.get("/all-orders", async(req, res)=>{
    const order = await Order.find()
    res.send(order)
})

router.delete("/:id", async(req, res)=>{
     await Order.findByIdAndDelete(req.params.id)
    res.send('Order Deleted Successfully!')
})

router.put("/:id", async(req, res)=>{
     await Order.findByIdAndUpdate(req.params.id, req.body)
    res.send('Order Updated Successfully!')
})

module.exports = router;
