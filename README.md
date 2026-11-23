# Rekaforma storefront

Static site, no build step. Open `index.html` through any local server:

```bash
python3 -m http.server 8000
```

- `index.html` homepage
- `product.html` Flower Clicker product page (`#sun`, `#sak`, `#dai` pick the flower)
- `checkout.html`, `thanks.html` checkout and order confirmation
- `shop-config.json` prices (in sen) and shipping rates; the server reads prices from here, never from the browser
- `functions/api/checkout.js` Cloudflare Pages Function that opens a Stripe Checkout session (FPX, card, GrabPay)
- `assets/img/logo-*.svg` logo traced from the brand PNGs, recoloured with CSS masks
- `assets/img/flower` product renders, `assets/img/spin` 36-frame 360° turns
- `tools/render` the scripts that made the renders from the Flower Clicker 3D model. They need `parts.js` (the model data exported from the Flower Clicker artifact, not committed: 10 MB) and `three@0.147.0` installed beside them.

## Going live

1. Create a Stripe account for a Malaysian business and turn on FPX and GrabPay.
2. Set both shipping prices in `shop-config.json`. Checkout stays closed while either is `null`.
3. Deploy the repo to Cloudflare Pages (no build command, output directory `/`).
4. In the Pages project settings add `STRIPE_SECRET_KEY` and `SITE_URL`.
5. Test with a `sk_test_` key and Stripe's test FPX bank, then switch to the live key.

Still to fill: weight, switch type, shipping days and policy, social links, and an email tool for the Photo Strip waitlist.
