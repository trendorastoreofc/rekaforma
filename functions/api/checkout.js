/* POST /api/checkout
   Cloudflare Pages Function. Takes the bag and delivery details from checkout.html,
   checks them against shop-config.json (never against prices the browser sent),
   and opens a Stripe Checkout session paid in MYR by FPX, card or GrabPay.

   Needs two environment variables in Cloudflare Pages settings:
     STRIPE_SECRET_KEY  sk_test_… while testing, sk_live_… when taking real orders
     SITE_URL           e.g. https://rekaforma.com (no trailing slash)
*/
import config from '../../shop-config.json';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY || !env.SITE_URL) return json({ error: 'Payments are not set up yet.' }, 503);
  if (Object.values(config.shipping).some((z) => z.price == null)) {
    return json({ error: 'Shipping rates are not set yet, so checkout is closed.' }, 503);
  }

  let data;
  try { data = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  const items = Array.isArray(data.items) ? data.items : [];
  const c = data.customer || {};

  const lines = [];
  for (const it of items) {
    const p = config.products[it && it.id];
    const qty = Math.floor(Number(it && it.qty));
    if (!p || !(qty >= 1 && qty <= 50)) return json({ error: 'Something in your bag is no longer available. Refresh and try again.' }, 400);
    lines.push({ p, qty });
  }
  if (!lines.length) return json({ error: 'Your bag is empty.' }, 400);

  const req = ['email', 'phone', 'name', 'line1', 'postcode', 'city', 'state'];
  if (req.some((k) => !String(c[k] || '').trim()) || !/^[0-9]{5}$/.test(c.postcode)) {
    return json({ error: 'Some delivery details are missing. Check the form and try again.' }, 400);
  }
  const zone = config.eastStates.includes(c.state) ? 'east' : 'west';
  const ship = config.shipping[zone];

  const f = new URLSearchParams();
  f.set('mode', 'payment');
  f.set('currency', config.currency);
  f.set('customer_email', c.email);
  f.set('success_url', `${env.SITE_URL}/thanks.html?session_id={CHECKOUT_SESSION_ID}`);
  f.set('cancel_url', `${env.SITE_URL}/checkout.html`);
  ['card', 'fpx', 'grabpay'].forEach((m, i) => f.set(`payment_method_types[${i}]`, m));
  lines.forEach(({ p, qty }, i) => {
    f.set(`line_items[${i}][quantity]`, String(qty));
    f.set(`line_items[${i}][price_data][currency]`, config.currency);
    f.set(`line_items[${i}][price_data][unit_amount]`, String(p.price));
    f.set(`line_items[${i}][price_data][product_data][name]`, p.name);
  });
  f.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
  f.set('shipping_options[0][shipping_rate_data][display_name]', `Shipping · ${ship.label}`);
  f.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(ship.price));
  f.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', config.currency);

  const addr = {
    'payment_intent_data[shipping][name]': c.name,
    'payment_intent_data[shipping][phone]': c.phone,
    'payment_intent_data[shipping][address][line1]': c.line1,
    'payment_intent_data[shipping][address][line2]': c.line2 || '',
    'payment_intent_data[shipping][address][postal_code]': c.postcode,
    'payment_intent_data[shipping][address][city]': c.city,
    'payment_intent_data[shipping][address][state]': c.state,
    'payment_intent_data[shipping][address][country]': 'MY',
    'metadata[phone]': c.phone,
    'metadata[note]': String(c.note || '').slice(0, 300)
  };
  Object.entries(addr).forEach(([k, v]) => f.set(k, v));

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: f
  });
  const out = await res.json();
  if (!res.ok) return json({ error: 'Payment could not start. Nothing was charged. Try again in a moment.', detail: out.error && out.error.message }, 502);
  return json({ url: out.url });
}
