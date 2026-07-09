# Send bookings to a Google Sheet (10 minutes, one time)

Every time someone taps **Make a Booking**, the site will append a row to your Sheet
and email you the order. Free, and the data stays entirely in your own Google account.

## 1. Create the Sheet
1. Go to https://sheets.google.com and create a new blank spreadsheet.
2. Name it something like `ori igi bookings`.
   (You don't need to add any headers — the script creates them on the first booking.)

## 2. Add the script
1. In that Sheet, click **Extensions ▸ Apps Script**. A new tab opens.
2. Delete whatever code is in the editor.
3. Open `Code.gs` (in this folder), copy **all** of it, and paste it in.
4. At the top of the script, check the line:
   ```js
   var NOTIFY_EMAIL = 'oriigiflame@gmail.com';
   ```
   Change it if you want the booking alerts sent to a different address.
5. Click the **Save** icon (💾).

## 3. Deploy it as a Web App
1. Click **Deploy ▸ New deployment**.
2. Click the gear ⚙ next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `ori igi bookings`
   - **Execute as:** **Me** (your account)
   - **Who has access:** **Anyone**   ← important, so the website can reach it
4. Click **Deploy**.
5. Google will ask you to **Authorize access** the first time:
   - Choose your account ▸ "Advanced" ▸ "Go to (project) (unsafe)" ▸ **Allow**.
   (This warning is normal for your own scripts.)
6. Copy the **Web app URL**. It ends in `/exec` and looks like:
   `https://script.google.com/macros/s/AKfycb..................../exec`

## 4. Give me that URL
Paste the `/exec` URL back to me and I'll drop it into the site (one line in `app.js`,
the `SHEETS_WEBAPP_URL` constant). After that, every booking is logged automatically.

## Test it
- Open the `/exec` URL in a browser — you should see
  `ori · igi booking endpoint is live.`
- Once the URL is wired into the site, make a test booking. A new row should appear in
  the Sheet within a second or two, and you'll get an email.

## Troubleshooting
- **Bookings aren't logging / no email?** Open the `/exec` URL in a browser. If it sends you
  to a Google **sign-in page** instead of showing "endpoint is live", then **Who has access**
  is not set to **Anyone**. Fix: **Deploy ▸ Manage deployments ▸ Edit (pencil) ▸ Who has
  access: Anyone ▸ Version: New version ▸ Deploy**. Editing the existing deployment keeps the
  same `/exec` URL, so nothing needs re-pasting. ("Anyone" — not "Anyone with Google account".)
- **Changed the email but alerts still go to the old one?** You must redeploy a **New version**
  after editing the script; the running deployment uses the version it was deployed with.

## Notes
- **Changing the script later?** You must **Deploy ▸ Manage deployments ▸ Edit ▸
  Version: New version** for changes to take effect (the `/exec` URL stays the same).
- **Columns logged:** Timestamp, Name, Phone, Email, Address, Order, Total guests,
  Subtotal, Delivery, Full service (Yes/No), Service fee, Total.
- The site sends the booking quietly in the background; if the Sheet is ever
  unreachable, the customer's WhatsApp hand-off and confirmation still work normally.
