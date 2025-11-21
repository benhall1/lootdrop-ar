import express, { type Express } from 'express';
import { storage } from './storage';
import { stripeService } from './stripeService';

export function registerRoutes(app: Express) {
  app.post('/api/auth/guest', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        user = await storage.createUser({ id: userId, email, name });
      }

      res.json({ user });
    } catch (error: any) {
      console.error('Auth error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/subscription/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.stripeSubscriptionId) {
        return res.json({ subscription: null, isPremium: false });
      }

      const subscription = await storage.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription, isPremium: user.isPremium });
    } catch (error: any) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/checkout', async (req, res) => {
    try {
      const { userId, priceId, email, name } = req.body;

      let user = await storage.getUser(userId);
      
      if (!user) {
        user = await storage.createUser({ id: userId, email, name });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email, user.id, user.name || undefined);
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/checkout/success`,
        `${baseUrl}/checkout/cancel`
      );

      res.json({ url: session.url });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.listProducts();
      res.json({ data: products });
    } catch (error: any) {
      console.error('Get products error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/products-with-prices', async (req, res) => {
    try {
      const rows = await storage.listProductsWithPrices();

      const productsMap = new Map();
      for (const row of rows) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error: any) {
      console.error('Get products with prices error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/products/:productId/prices', async (req, res) => {
    try {
      const { productId } = req.params;

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const prices = await storage.getPricesForProduct(productId);
      res.json({ data: prices });
    } catch (error: any) {
      console.error('Get prices error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
