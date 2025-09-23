const express = require("express");
const Customer = require("../models/Customer");

const router = express.Router();

// Only superadmin/admin can create wholesaler
router.post("/create-customer", async(req, res)=>{
    const newCustomer = new Customer(req.body)
    await newCustomer.save()
    res.send('Customer created successfully')
});



router.get("/all-customers/:id", async(req, res)=>{
    const customer = await Customer.find({
        wholesaler : req.params.id
    })
    res.send(customer)
})

router.delete("/:id", async(req, res)=>{
     await Customer.findByIdAndDelete(req.params.id)
    res.send('Customer Deleted Successfully!')
})

router.put("/:id", async(req, res)=>{
     await Customer.findByIdAndUpdate(req.params.id, req.body)
    res.send('Customer Updated Successfully!')
})

module.exports = router;
