import { getUncachableStripeClient } from './stripeClient';

interface DonationPackage {
  name: string;
  description: string;
  amount: number;
  coins: number;
  metadata?: Record<string, string>;
}

const DONATION_PACKAGES: DonationPackage[] = [
  {
    name: 'Warmth Pack',
    description: 'Support children with essential warmth supplies',
    amount: 500,
    coins: 500,
  },
  {
    name: 'Gift Bundle',
    description: 'Provide food and clothing for families in need',
    amount: 1000,
    coins: 1200,
  },
  {
    name: 'Hero Package',
    description: "Make a significant impact on children's lives",
    amount: 2500,
    coins: 3500,
  },
  {
    name: 'Champion Bundle',
    description: 'Become a champion for children this winter',
    amount: 5000,
    coins: 8000,
  },
  {
    name: 'Legend Pack',
    description: 'Legendary donation - maximum impact for families',
    amount: 10000,
    coins: 20000,
  },
];

const GAMEPASS_PACKAGE: DonationPackage = {
  name: 'Season Pass',
  description: 'Unlock exclusive perks: 2x XP gain, bonus starting coins each game, and access to all premium skins!',
  amount: 1500,
  coins: 1500,
  metadata: { type: 'gamepass', perks: '2x_xp,bonus_coins,all_skins' },
};

const SKIN_PACKAGES: DonationPackage[] = [
  {
    name: 'Snowflake Thrower',
    description: 'A frosty blue player with snowflake trail effects',
    amount: 300,
    coins: 300,
    metadata: { type: 'skin', skinId: 'snowflake', color: '0x87CEEB' },
  },
  {
    name: 'Candy Cane Hero',
    description: 'Red and white striped festive look',
    amount: 500,
    coins: 500,
    metadata: { type: 'skin', skinId: 'candycane', color: '0xFF0000' },
  },
  {
    name: 'Golden Gift Giver',
    description: 'Luxurious gold player with sparkle effects',
    amount: 800,
    coins: 800,
    metadata: { type: 'skin', skinId: 'golden', color: '0xFFD700' },
  },
  {
    name: 'Aurora Champion',
    description: 'Magical aurora borealis effects with color-shifting player',
    amount: 1200,
    coins: 1200,
    metadata: { type: 'skin', skinId: 'aurora', color: '0x9400D3' },
  },
];

async function createProduct(stripe: any, pkg: DonationPackage) {
  try {
    const existingProducts = await stripe.products.search({
      query: `name:'${pkg.name}'`,
    });

    if (existingProducts.data.length > 0) {
      console.log(`Product "${pkg.name}" already exists, skipping...`);
      return;
    }

    const metadata: Record<string, string> = {
      coins: pkg.coins.toString(),
      type: pkg.metadata?.type || 'donation',
      ...pkg.metadata,
    };

    const product = await stripe.products.create({
      name: pkg.name,
      description: pkg.description,
      metadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pkg.amount,
      currency: 'usd',
      metadata: {
        coins: pkg.coins.toString(),
      },
    });

    console.log(`Created "${pkg.name}" - Product: ${product.id}, Price: ${price.id}`);
  } catch (error) {
    console.error(`Failed to create "${pkg.name}":`, error);
  }
}

async function seedProducts() {
  console.log('Starting to seed products...');
  
  const stripe = await getUncachableStripeClient();

  console.log('Seeding donation packages...');
  for (const pkg of DONATION_PACKAGES) {
    await createProduct(stripe, pkg);
  }

  console.log('Seeding Game Pass...');
  await createProduct(stripe, GAMEPASS_PACKAGE);

  console.log('Seeding skins...');
  for (const pkg of SKIN_PACKAGES) {
    await createProduct(stripe, pkg);
  }

  console.log('Finished seeding all products!');
}

seedProducts().catch(console.error);
