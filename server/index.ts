import express from 'express';
import cors from 'cors';
import { runMigrations } from 'stripe-replit-sync';
import { registerRoutes } from './routes';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';

const app = express();
const PORT = process.env.PORT || 5000;

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('DATABASE_URL not found. Stripe features will be limited.');
    return false;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl,
      schema: 'stripe'
    });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'],
        description: 'Managed webhook for Stripe sync',
      }
    );
    console.log(`Webhook configured: ${webhook.url} (UUID: ${uuid})`);

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => {
        console.log('Stripe data synced');
      })
      .catch((err: any) => {
        console.error('Error syncing Stripe data:', err);
      });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Stripe (non-fatal):', error);
    return false;
  }
}

async function startServer() {
  const stripeReady = await initStripe();
  if (!stripeReady) {
    console.warn('Server starting without Stripe integration');
  }

  app.use(cors());

  app.post(
    '/api/stripe/webhook/:uuid',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature' });
      }

      try {
        const sig = Array.isArray(signature) ? signature[0] : signature;

        if (!Buffer.isBuffer(req.body)) {
          const errorMsg = 'STRIPE WEBHOOK ERROR: req.body is not a Buffer. ' +
            'This means express.json() ran before this webhook route. ' +
            'FIX: Move this webhook route registration BEFORE app.use(express.json()) in your code.';
          console.error(errorMsg);
          return res.status(500).json({ error: 'Webhook processing error' });
        }

        const { uuid } = req.params;
        await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);

        res.status(200).json({ received: true });
      } catch (error: any) {
        console.error('Webhook error:', error.message);

        if (error.message && error.message.includes('payload must be provided as a string or a Buffer')) {
          const helpfulMsg = 'STRIPE WEBHOOK ERROR: Payload is not a Buffer. ' +
            'This usually means express.json() parsed the body before the webhook handler. ' +
            'FIX: Ensure the webhook route is registered BEFORE app.use(express.json()).';
          console.error(helpfulMsg);
        }

        res.status(400).json({ error: 'Webhook processing error' });
      }
    }
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  registerRoutes(app);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
