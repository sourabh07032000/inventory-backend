const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Only superadmin/admin can create wholesaler
router.post("/create-wholesaler", async(req, res)=>{
    const newUser = new User(req.body)
    await newUser.save()
    res.send('User created successfully')
});

router.post("/login-verify", async(req, res)=>{
    const user = await User.findOne({email : req.body.email})
    res.send(user._id)
})

router.get("/:id", async(req, res)=>{
    const user = await User.findById(req.params.id)
    res.send(user)
})

module.exports = router;
