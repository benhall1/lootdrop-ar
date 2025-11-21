import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating LootDrop AR subscription products...');

  const existingProducts = await stripe.products.search({
    query: "active:'true' AND name:'LootDrop Premium'",
  });

  if (existingProducts.data.length > 0) {
    console.log('LootDrop Premium already exists');
    return;
  }

  const product = await stripe.products.create({
    name: 'LootDrop Premium',
    description: 'Unlock unlimited AR loot box claims, exclusive merchant deals, and premium features',
    metadata: {
      features: JSON.stringify([
        'Unlimited loot box claims',
        'Exclusive premium merchant deals',
        'Priority access to new features',
        'Ad-free experience',
        'Advanced AR filters'
      ]),
      app: 'lootdrop-ar'
    }
  });

  console.log(`Created product: ${product.id}`);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      name: 'Monthly',
      popular: 'false'
    }
  });

  console.log(`Created monthly price: ${monthlyPrice.id} ($9.99/month)`);

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 7999,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: {
      name: 'Yearly',
      popular: 'true',
      savings: '33%'
    }
  });

  console.log(`Created yearly price: ${yearlyPrice.id} ($79.99/year - Save 33%)`);

  console.log('\n✅ Products created successfully!');
  console.log('Run your server to sync these products to the database.');
}

createProducts().catch(console.error);
