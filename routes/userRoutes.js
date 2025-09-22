import express from "express";
import User from "../models/User";

const router = express.Router();

// Only superadmin/admin can create wholesaler
router.post("/create-wholesaler", async(req, res)=>{
    const newUser = new User(req.body)
    await newUser.save()
    res.send('User created successfully')
});

export default router;
