const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// Only superadmin/admin can create wholesaler
router.post("/create-product", async(req, res)=>{
    const newProduct = new Product(req.body)
    await newProduct.save()
    res.send('Product created successfully')
});



router.get("/all-products/:id", async(req, res)=>{
    const product = await Product.find({
        wholesaler : req.params.id
    })
    res.send(product)
})

router.delete("/:id", async(req, res)=>{
     await Product.findByIdAndDelete(req.params.id)
    res.send('Product Deleted Successfully!')
})

router.put("/:id", async(req, res)=>{
     await Product.findByIdAndUpdate(req.params.id, req.body)
    res.send('Product Updated Successfully!')
})

module.exports = router;
