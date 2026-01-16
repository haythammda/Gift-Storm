import { getUncachableStripeClient } from './stripeClient';

async function createTestCoupon() {
  try {
    console.log('Creating test coupon COPTES2026...');
    
    const stripe = await getUncachableStripeClient();
    
    // Check if promotion code already exists
    try {
      const existingPromos = await stripe.promotionCodes.list({
        code: 'COPTES2026',
        limit: 1,
      });
      
      if (existingPromos.data.length > 0) {
        console.log('Coupon COPTES2026 already exists!');
        console.log('Promotion Code ID:', existingPromos.data[0].id);
        return;
      }
    } catch (e) {
      // Continue if not found
    }

    // First, try to get existing coupon or create new one
    let couponId: string;
    try {
      const existingCoupon = await stripe.coupons.retrieve('coptes2026-test-coupon');
      console.log('Coupon already exists:', existingCoupon.id);
      couponId = existingCoupon.id;
    } catch (e) {
      // Create a 100% off coupon
      const coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: 'forever',
        name: 'Test Coupon - 100% Off',
        id: 'coptes2026-test-coupon',
      });
      console.log('Created coupon:', coupon.id);
      couponId = coupon.id;
    }

    // Create a promotion code for this coupon using the Stripe SDK 
    // Note: using proper expand to include coupon
    try {
      const promoCode = await stripe.promotionCodes.create({
        coupon: couponId,
        code: 'COPTES2026',
      } as any);  // Using 'as any' to bypass type issues
      
      console.log('Created promotion code:', promoCode.code);
      console.log('Promotion Code ID:', promoCode.id);
      console.log('\nTest coupon COPTES2026 is now active!');
      console.log('This coupon gives 100% off any purchase for testing.');
    } catch (promoError: any) {
      if (promoError.code === 'resource_already_exists') {
        console.log('Promotion code COPTES2026 already exists!');
        // List to get the ID
        const existingPromos = await stripe.promotionCodes.list({
          code: 'COPTES2026',
          limit: 1,
        });
        if (existingPromos.data.length > 0) {
          console.log('Promotion Code ID:', existingPromos.data[0].id);
        }
      } else {
        console.error('Error creating promotion code:', promoError.message);
        console.log('\nNote: You can create the promotion code manually in the Stripe Dashboard:');
        console.log('1. Go to https://dashboard.stripe.com/test/coupons');
        console.log('2. Find coupon "coptes2026-test-coupon"');
        console.log('3. Create a promotion code with code "COPTES2026"');
      }
    }

  } catch (error: any) {
    console.error('Error creating test coupon:', error);
  }
}

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

createTestCoupon().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
