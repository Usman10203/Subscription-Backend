const express = require('express');
const router = express.Router();
require("dotenv").config()
const stripeController = require("../controllers/stripeController")

router.use(express.json());

router.post('/create-subscription-checkout-session', stripeController.createCheckout);
router.post('/payment-success', stripeController.confirmPayment);


module.exports = router;