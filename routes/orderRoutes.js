const express = require("express");
const Order = require("../models/Order");
const Customer = require('../models/Customer')
const router = express.Router();

// Only superadmin/admin can create wholesaler
router.post("/create-order", async(req, res)=>{
    
    try {
    const oldCustomer = await Customer.findOne({phone : req.body.customerPhone})
    if(!oldCustomer){
        const newCustomer = new Customer({
            name : req.body.customerName,
            phone : req.body.customerPhone
        })
        await newCustomer.save()
    }
    const {
      orderNumber,
      customerName,
      customerPhone,
      products,
      subtotal,
      discount,
      tax,
      grandTotal,
      paymentMethod,
      paymentStatus,
      wholesaler,
      orderStatus,
    } = req.body;

    // Validation
    if (!orderNumber || !customerName || !customerPhone || !products || products.length === 0) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Calculate totals if not provided (optional safety check)
    const calculatedSubtotal = products.reduce((acc, item) => acc + item.totalPrice, 0);
    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalGrandTotal = grandTotal || finalSubtotal - (discount || 0) + (tax || 0);

    const newOrder = new Order({
      orderNumber,
      customerName,
      customerPhone,
      customerAddress,
      products,
      subtotal: finalSubtotal,
      discount: discount || 0,
      tax: tax || 0,
      grandTotal: finalGrandTotal,
      paymentMethod,
      paymentStatus: paymentStatus || "pending",
      wholesaler,
      orderStatus: orderStatus || "pending",
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



router.get("/all-orders/:id", async(req, res)=>{
    const order = await Order.find({
        wholesaler : req.params.id
    })
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
