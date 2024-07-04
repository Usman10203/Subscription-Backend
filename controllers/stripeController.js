const express = require('express');

require("dotenv").config()
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey");
const moment = require("moment");

const [basic, pro, business] =
    [process.env.BASIC_PLAN, process.env.PRO_PLAN, process.env.BUSINESS_PLAN];

const stripeSession = async (plan) => {
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: plan,
                    quantity: 1
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`

        });
        return session;
    } catch (e) {
        return e;
    }
};

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)


module.exports = {
    createCheckout: async (req, res) => {
        const { plan, customerId } = req.body;
        let planId = null;
        if (plan == 99) planId = basic;
        else if (plan == 499) planId = pro;
        else if (plan == 999) planId = business;

        try {
            const session = await stripeSession(planId);
            const user = await admin.auth().getUser(customerId);
            await admin.database().ref("users").child(user.uid).update({
                subscription: {
                    sessionId: session.id
                }
            });
            return res.json({ session })
        } catch (error) {
            res.send(error)
        }

    },

    confirmPayment: async (req, res) => {
        const { sessionId, firebaseId } = req.body;
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status === 'paid') {
                const subscriptionId = session.subscription;
                try {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const user = await admin.auth().getUser(firebaseId);
                    const planId = subscription.plan.id;
                    let planType;
                    if (subscription.plan.amount == 9900) {
                        planType = "basic";
                    } else if (subscription.plan.amount == 49900) {
                        planType = "pro";
                    } else if (subscription.plan.amount == 99900) {
                        planType = "business";
                    }
                    //const planType = subscription.plan.amount === 50000 ? "basic" : "pro";
                    const startDate = moment.unix(subscription.current_period_start).format('YYYY-MM-DD');
                    const endDate = moment.unix(subscription.current_period_end).format('YYYY-MM-DD');
                    const durationInSeconds = subscription.current_period_end - subscription.current_period_start;
                    const durationInDays = moment.duration(durationInSeconds, 'seconds').asDays();
                    await admin.database().ref("users").child(user.uid).update({
                        subscription: {
                            sessionId: null,
                            planId: planId,
                            planType: planType,
                            planStartDate: startDate,
                            planEndDate: endDate,
                            planDuration: durationInDays
                        }
                    });


                } catch (error) {
                    console.error('Error retrieving subscription:', error);
                }
                return res.json({ message: "Payment successful" });
            } else {
                return res.json({ message: "Payment failed" });
            }
        } catch (error) {
            res.send(error);
        }

    }




}