# ReLoop — Simple second-hand marketplace

A small HTML, CSS, and JavaScript project. No framework, build step, API key, or
package installation is needed to run it. Listings and purchases stay in this browser.

## Run

Open `index.html` with VS Code Live Server, or run this command in the project folder:

```sh
python3 -m http.server 8000
```

Open **http://localhost:8000**. Use the same browser, hostname, and port to keep your
saved data. Opening files directly may prevent storage from working between pages.

## Interface and styling

The interface uses a warm cream background, sage-green accents, serif page headings,
rounded cards, and subtle shadows. The home banner pairs a short introduction with the
existing local `assets/hero.svg` illustration. **Explore finds** jumps to the product
section, and **Sell an item** opens the listing form.

Navigation, product cards, forms, purchase history, and dialogs share the same theme.
Active navigation links use a soft green background, and demo listings have a small label.
Cards have a subtle hover effect, disabled when the device requests reduced motion.
The layout adapts to phones without requiring a framework, online fonts, or new dependencies.

## What you can do

- Search eight demo products and filter by category or city; sort by price or date.
- Save favourites, record enquiries, and report a listing.
- Create a listing with an optional JPG, PNG, or WebP photo up to 2 MB.
- Edit, delete, mark sold, and relist your own items.
- Select **Buy now**, enter buyer details, and save a demo purchase.
- Open **My purchases** to edit pending details, mark received, or cancel.

Purchasing makes an item unavailable. Cancelling a pending purchase makes it available
again, unless the listing was deleted or separately marked sold. Received purchases
stay sold. Your own items cannot be purchased.

## Where to change things

| Change                                         | Edit here                                               |
| ---------------------------------------------- | ------------------------------------------------------- |
| Sample products, prices, and descriptions      | `SAMPLE_PRODUCTS` near the top of `myapp.js`            |
| Categories and fallback illustrations          | `CATEGORIES` and `ART` in `myapp.js`                    |
| Menu links and footer text on every page       | `initLayout()` in `myapp.js`                            |
| Product cards                                  | `productCard()` in `myapp.js`                           |
| Product detail layout                          | `renderDetail()` in `myapp.js`                          |
| Checkout fields                                | `initPurchaseDialog()` and `BUYER_FIELDS` in `myapp.js` |
| Checkout checks and saving                     | `savePurchase()` in `myapp.js`                          |
| Purchase history                               | `renderPurchases()` in `myapp.js`                       |
| Sell form fields                               | `sell.html`; keep IDs in sync with `LISTING_FIELDS`     |
| Page headings and instructions                 | The matching HTML file                                  |
| Home banner copy, illustration, and buttons    | `.home-intro` in `index.html`                           |
| Colors, spacing, card sizes, and mobile layout | `mystyles.css`                                          |

Each JavaScript function has a short comment explaining its purpose. `byId()` finds an
HTML element by ID. `readFields()` reads and trims form values. `readStore()` and
`writeStore()` load/save arrays in browser storage. These small helpers avoid repeated code.

Every HTML page contains its own content and empty header/footer containers. The shared
script fills the menu and footer, so you edit them in one place. Search uses simple
select boxes, cards use text buttons, and CSS has one mobile breakpoint.

## Which CSS colors affect which sections?

The `:root` block at the top of `mystyles.css` is the color list. Change a value there
instead of searching through the entire stylesheet. For example:

```css
--brand-color: #214f40; /* Logo, links, primary buttons, and active menu */
--intro-bg: #e9eee5; /* Home banner, matching the SVG illustration */
--surface-bg: #ffffff; /* Header, cards, forms, and dialogs */
```

| Color variable                       | Affects                                                  |
| ------------------------------------ | -------------------------------------------------------- |
| `--page-bg`                          | Whole page background                                    |
| `--surface-bg`                       | Header, cards, forms, and dialogs                        |
| `--text-color` / `--muted-color`     | Main text / hints, dates, and secondary text             |
| `--brand-color` / `--button-hover`   | Logo, links, buttons, active menu / button hover         |
| `--border-color`                     | Field, card, header, and footer borders                  |
| `--intro-bg`                         | Home introduction                                        |
| `--accent-color`                     | Home-banner label and logo dot                           |
| `--notice-bg`                        | Demo notices, image backgrounds, and checkout summary    |
| `--danger-color` / `--danger-bg`     | Errors, delete/cancel styling, and sold labels           |
| `--success-bg` / `--pending-bg`      | Received / awaiting purchase status                      |
| `--button-text` / `--backdrop-color` | Text on buttons, SOLD labels, and toast / dialog overlay |
| `--focus-color`                      | Outline when navigating with the keyboard                |

CSS section comments identify the rules for the header, buttons, forms, product cards,
product details, purchases, notices, dialogs, footer, and small screens.
Illustration colors are inside the SVG files in `assets/`; CSS colors control the
surrounding cards and page sections.

The same `:root` block includes `--heading-font` for the serif titles,
`--card-radius` for rounded corners, and `--card-shadow` for soft card shadows.
Edit these settings to adjust the look consistently across pages. The body uses
system fonts, so nothing needs to be downloaded. The small-screen rules are near
the end of the stylesheet; the reduced-motion rule follows them.

## Pages

`index.html` is the home page. `list.html` is browsing. `sell.html` creates/edits listings.
`product.html` shows details. `mylistings.html`, `purchases.html`, `saved.html`, and
`messages.html` show your local records. `guide.html` explains usage and trading tips.
`assets/` contains local SVG illustrations. `.prettierrc.json` controls formatting.

## Buyer details and saved data

Checkout asks for a name (2–80 characters), email (up to 120 characters), phone number
(7–15 digits, up to 25 characters with formatting), collection/delivery choice, a meetup
location or delivery address (5–300 characters), and optional notes (up to 500 characters).
Use sample details. No money is charged, seller contacted, or delivery arranged.

A receipt keeps the original product and price even if the listing later changes or is
removed. Pending buyer details can be edited; received and cancelled records stay in
history. Checkout rechecks availability and asks you to review a changed title or price.
If saving fails, the form keeps your entered details. Other open tabs update automatically.

Storage keys are `reloop.listings.v1`, `reloop.saved.v1`, `reloop.messages.v1`,
`reloop.reports.v1`, and `reloop.purchases.v1`. They match earlier versions of this project.

This is a shared browser demo with no authentication, backend, real messaging, payments,
or moderation. Contact details are plain browser data, visible to users of that profile.
Data is not synced or backed up. Simultaneous writes are not database transactions.

## Check changes

With Node.js 18 or newer, run the 16 purchase regression tests and check JavaScript syntax:

```sh
node --test tests/purchases.test.cjs
node --check myapp.js
```

In a browser, create/edit a listing, use all filters, save an item, purchase a demo product,
refresh, edit its details, cancel it, and purchase it again. Mark it received and confirm
it stays sold. Check the pages on a narrow screen too.

Optional formatting check (downloads Prettier on the first run):

```sh
npx prettier --check '*.html' '*.js' '*.css' '*.md' '*.json' 'tests/*.cjs'
```

## Reset or troubleshoot

- To reset, remove only this site's `reloop.` keys in Developer Tools → Application/Storage
  → Local Storage, then refresh. This clears local records and restores sample products.
- If data seems missing, check the browser profile, hostname, and port. `localhost` and
  `127.0.0.1`, or different ports, have separate storage.
- If saving fails, enable browser storage or free space. Use smaller photos.
- If port 8000 is busy, use `python3 -m http.server 8001` and visit `http://localhost:8001`.
