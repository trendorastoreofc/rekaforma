# Rekaforma storefront

Static site, no build step. Open `index.html` through any local server:

```bash
python3 -m http.server 8000
```

- `index.html` homepage
- `product.html` Flower Clicker product page (`#sun`, `#sak`, `#dai` pick the flower)
- `assets/img/flower` product renders, `assets/img/spin` 36-frame 360° turns
- `tools/render` the scripts that made the renders from the Flower Clicker 3D model. They need `parts.js` (the model data exported from the Flower Clicker artifact, not committed: 10 MB) and `three@0.147.0` installed beside them.

Placeholders still to fill: prices (`RM [price]`), weight, switch type, shipping days and policy, social links.
