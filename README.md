# ori · igi — Bulk Catering site

Production build of the Claude Design handoff (`ori igi - Bulk Catering.dc.html`).
Plain HTML/CSS/JS, no build step. Open `index.html` or serve the folder.

## Files
- `index.html` — page structure (hero, marquee, spread, how-it-works, calculator, FAQ, footer)
- `styles.css` — all styling; brand tokens (cream `#EED3CF` + oxblood `#74313A`, Plus Jakarta Sans + JetBrains Mono) as CSS variables at the top
- `app.js` — ordering logic: scroll-morph hero, basket, live volume/price estimate, booking flow, FAQ
- `assets/dish-pounded-yam.png` — the one real dish photo from the handoff

## What works
- **Scroll-morph hero** — scrolling the page fans a menu of 7 dishes on an arc behind a centred plate that crossfades; category tabs, kicker, progress bar, ghost headline and warm glow all track the active dish. Lands on the featured dish (Pounded Yam) on load.
- **Basket** — `+` on any plate adds it (20-guest minimum); dropdown panel with quantity steppers.
- **Volume estimate** — line items, per-item guest steppers, a "set everyone to N guests" bulk slider, an optional full-service toggle. Live totals: subtotal + 15% delivery + 40% service.
- **Booking** — contact form gates the "Make a Booking" button; submitting shows an order confirmation. Reset starts a fresh order.
- **FAQ** accordion, marquee, responsive down to 375px, `prefers-reduced-motion` respected.

## Contact / booking wiring
"Make a call", "Chat on WhatsApp" and "Make a Booking" all use one number, set in a
single constant near the top of `app.js`:

```js
const BUSINESS_PHONE = '2348012345678';   // country code first, digits only, no + or spaces
```

The live number is `+234 707 396 5446`. "Make a Booking" opens WhatsApp to that number
with the full order (dishes, guest counts, totals, and the customer's contact details)
pre-typed, then shows the on-page confirmation. No backend or signup required.

## Logging bookings to Google Sheets
Each booking can also be appended to a Google Sheet (+ email alert). See
`google-apps-script/SETUP.md` for the one-time deploy. After deploying, paste the
Apps Script `/exec` URL into the `SHEETS_WEBAPP_URL` constant near the top of `app.js`.
While that constant is empty, logging is skipped and nothing else is affected.

## Images to add
Only Pounded Yam has a real photo. The other six dishes (Jollof Rice, Fried Rice, Ofada
Rice, Eba, Amala, Small Chops) fall back to a coloured medallion + label. Drop real
plated photos into `assets/` and set the matching `img:` path in the `DISHES` array in `app.js`
(same overhead marble style as the Pounded Yam shot for consistency).
