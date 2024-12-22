
const stripe= require('stripe')(process.env.STRIPE_KEY)
const { createCoreController } = require('@strapi/strapi').factories;

/**
 * order controller
 */
module.exports = createCoreController('api::order.order',({strapi})=>({
    async create(ctx) {
        const {products} = ctx.request.body
        
        try{
            const lineItems=await Promise.all(
                products.map(async (product)=>{
                    const item=await strapi.db.query("api::product.product").findOne(product.id)
                    return {
                        price_data:{
                            currency:'eur',
                            unit_amount:item.price*100,
                            product_data:{
                                name:item.productName,
                            }
                        },
                        quantity:1
                    }
                })
            )

            const session=await stripe.checkout.sessions.create({
                shipping_address_collection:{allowed_countries:['ES']},
                payment_method_types:['card'],
                line_items:lineItems,
                mode:'payment',
                success_url:process.env.CLIENT_URL+'/success',
                cancel_url:process.env.CLIENT_URL+'/sucessError',
            })

            await strapi.db.query("api::order.order").create({
               data:{
                   products,
                   stripeId:session.id
               }
            })
            return {stripeSession:session}

        } catch(error){
            ctx.response.status=500
            return {error}
        }
    }
}));












/*
import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::order.order');

*/