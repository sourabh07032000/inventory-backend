const mongoose = require("mongoose");
const { Schema } = mongoose;

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },

    // For tracking customer type (e.g. retailer / wholesaler’s client)
    customerType: {
      type: String,
      enum: ["retail", "wholesale"],
      default: "retail",
    },

    // Outstanding balance (if wholesaler sells on credit)
    balance: { type: Number, default: 0 },

    // For loyalty programs or frequent buyers
    totalPurchases: { type: Number, default: 0 },

    // If linked to wholesaler
    wholesalerId: { type: Schema.Types.ObjectId, ref: "Wholesaler" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
