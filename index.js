const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const axios = require("axios");
const stripe = require("stripe")("");

const port = 4000;

app.use(express.json());

app.use(cors());

// Route to create a new card
app.post("/create-card", async (req, res) => {
  try {
    // const { token } = req.body;
    const token = "tok_sg";
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: token,
      },
    });
    // Attach the payment method to a customer
    const customer = await stripe.customers.create({
      payment_method: paymentMethod.id,
      name: "Leeswa ",
      email: "newtest@email.com",
    });

    // Set the newly created payment method as default for the customer
    // await stripe.customers.update(customer.id, {
    //   invoice_settings: {
    //     default_payment_method: paymentMethod.id,
    //   },
    // });

    res.json({ success: true, paymentMethod, customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to display cards for a customer
app.get("/customer-cards", async (req, res) => {
  try {
    // const { customerId } = req.body;
    // const { customerId } = req.query;
    const paymentMethods = await stripe.customers.listPaymentMethods(
      "cus_PnuOphxSbYxAtB",
      { type: "card" }
    );

    res.json({ success: true, cards: paymentMethods.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Route to create payment
app.post("/create-payment", async (req, res) => {
  try {
    // const { customerId, amount, currency } = req.body;

    const customerId = "cus_PnuOphxSbYxAtB";
    const amount = 9000;
    const currency = "sgd";

    // Retrieve the customer's default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const paymentMethodId = customer.invoice_settings.default_payment_method;

    // Create a payment intent without confirming it immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirmation_method: "manual",
    });

    // If the payment intent status is succeeded
    if (paymentIntent.status === "succeeded") {
      // Payment is successful
      res.json({ success: true, paymentIntent });
    } else {
      // Confirm the payment intent if it's not already succeeded
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id,
        {
          payment_method: paymentMethodId,
          return_url: "https://example.com/success", // this is should be changed for mobile phones
        }
      );

      // If the confirmed payment intent status is succeeded
      if (confirmedPaymentIntent.status === "succeeded") {
        // Payment is successful
        res.json({ success: true, paymentIntent: confirmedPaymentIntent });
      } else {
        // Payment failed
        res.status(500).json({ error: "Payment failed" });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
