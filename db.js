const mongoose = require('mongoose')

const connectDB = ()=>{
    mongoose.connect('mongodb+srv://sorhub:sorhub07@cluster0.hrtyd.mongodb.net/inventory').then(
        (res)=>{console.log(`MongoDB connected Successfully!`)}
    )
}

module.exports = connectDB