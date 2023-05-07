//stripe
const stripe = require("stripe")(process.env.STRIPE_KEY);

("use strict");

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { cart } = ctx.request.body;
    if (!cart) {
      ctx.response.status = 400;
      return { error: "No cart found in request body" };
    }
    // create tax rate in sripe 
    // const taxRate = await stripe.taxRates.create({
    //   display_name: "HST",
    //   inclusive: false,
    //   percentage: 13,
    //   country: "CA",
    //   state: "ON",
    //   jurisdiction: "CA - Ontario",
    //   description: "HST",
    // });

    const lineItems = await Promise.all(
      cart.map(async (product) => {
        const item = await strapi
          .service("api::product.product")
          .findOne(product.id);
        return {
          price_data: {
            currency: "cad",
            product_data: {
              name: item.Title,
            },
            unit_amount: item.Price * 100,
          },
          quantity: product.amount,
          tax_rates: ['txr_1N5E4kCF9lsfNwOvK5nCBKd5'],
        };
      })
    );
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}?success=true`,
        cancel_url: `${process.env.CLIENT_URL}?success=false`,
        line_items: lineItems,
        shipping_address_collection: {
          allowed_countries: ["CA", "US"],
        },
        payment_method_types: ["card"],
      });

      await strapi.service("api::order.order").create({
        data: {
          products: cart,
          stripID: session.id,
        },
      });
      return { stripeSession: session };
    } catch (error) {
      ctx.response.status = 500;
    }
  },
}));
