/* ReLoop: simple JavaScript shared by every page. No framework is needed.
   To change sample products, edit SAMPLE_PRODUCTS below.
   To change colors or spacing, open mystyles.css. */

// Storage names stay the same so earlier listings and purchases still load.
const STORE = {
  listings: 'reloop.listings.v1',
  saved: 'reloop.saved.v1',
  messages: 'reloop.messages.v1',
  reports: 'reloop.reports.v1',
  purchases: 'reloop.purchases.v1'
};
const CATEGORIES = ['Electronics', 'Furniture', 'Books', 'Fashion', 'Sports'];
const ART = {
  Electronics: 'monitor',
  Furniture: 'chair',
  Books: 'books',
  Fashion: 'sneakers',
  Sports: 'bicycle'
};
const LISTING_FIELDS = ['title', 'category', 'condition', 'price', 'city', 'description', 'seller'];
const BUYER_FIELDS = ['name', 'email', 'phone', 'method', 'location', 'notes'];
const PURCHASE_STATUS = {
  placed: 'Awaiting collection / delivery',
  received: 'Received',
  cancelled: 'Cancelled'
};
const NOW = Date.now();

// Sample products appear when no listings have been saved yet.
const SAMPLE_PRODUCTS = [
  {
    id: 'demo-chair',
    title: 'The cosy reading chair',
    category: 'Furniture',
    price: 3200,
    condition: 'Good',
    city: 'Bengaluru',
    seller: 'Aarav',
    image: 'assets/chair.svg',
    description:
      'A comfortable green lounge chair with wooden legs. About two years old, with a few light scuffs on the legs. Upholstery is clean and the cushion is included. Inspect the chair before arranging a purchase.'
  },
  {
    id: 'demo-headphones',
    title: 'Wireless over-ear headphones',
    category: 'Electronics',
    price: 1800,
    condition: 'Like new',
    city: 'Bengaluru',
    seller: 'Meera',
    image: 'assets/headphones.svg',
    description:
      'Wireless headphones used for six months. Includes a charging cable. Small mark on the left ear cup; both speakers and the microphone work. Please test them in person before buying.'
  },
  {
    id: 'demo-bicycle',
    title: 'Your next city bicycle',
    category: 'Sports',
    price: 6500,
    condition: 'Good',
    city: 'Bengaluru',
    seller: 'Rohan',
    image: 'assets/bicycle.svg',
    description:
      'A city bicycle with a medium frame, rear rack, and mudguards. Recently serviced. There are scratches on the frame and the bell needs replacing. A test ride is welcome at a safe public location.'
  },
  {
    id: 'demo-camera',
    title: 'Instant camera, endless memories',
    category: 'Electronics',
    price: 4200,
    condition: 'Good',
    city: 'Mysuru',
    seller: 'Ananya',
    image: 'assets/camera.svg',
    description:
      'A well-loved instant camera with a wrist strap. The body has minor scratches and works with fresh batteries. Film and batteries are not included. Check compatibility and test before buying.'
  },
  {
    id: 'demo-lamp',
    title: 'A little light for your desk',
    category: 'Furniture',
    price: 750,
    condition: 'Good',
    city: 'Bengaluru',
    seller: 'Kiran',
    image: 'assets/lamp.svg',
    description:
      'An adjustable desk lamp with a sage green shade. Includes a working bulb. The base has a small paint chip and the cord has no visible damage. Please inspect and test the lamp before purchase.'
  },
  {
    id: 'demo-books',
    title: 'A weekend’s worth of good reads',
    category: 'Books',
    price: 450,
    condition: 'Good',
    city: 'Bengaluru',
    seller: 'Diya',
    image: 'assets/books.svg',
    description:
      'A set of four assorted books for a relaxed weekend. Pages are intact, with a few pencil notes and normal wear on the covers. This is an illustrative sample listing; confirm the actual titles with a real seller.'
  },
  {
    id: 'demo-sneakers',
    title: 'Everyday sneakers · size 8',
    category: 'Fashion',
    price: 1200,
    condition: 'Fair',
    city: 'Hyderabad',
    seller: 'Kabir',
    image: 'assets/sneakers.svg',
    description:
      'Off-white everyday sneakers, size 8. Freshly cleaned, with visible wear on the soles and a small stain near one heel. Please check fit and condition in person. Original packaging is not included.'
  },
  {
    id: 'demo-monitor',
    title: '24-inch desktop monitor',
    category: 'Electronics',
    price: 5200,
    condition: 'Good',
    city: 'Bengaluru',
    seller: 'Isha',
    image: 'assets/monitor.svg',
    description:
      'A 24-inch monitor with a stand and power cable. Around three years old, with light scratches on the stand. No known dead pixels in this sample description. Check all ports and display quality before buying.'
  }
].map(function (product, index) {
  return { ...product, owner: 'sample', sold: false, createdAt: NOW - (index + 1) * 3600000 };
});

// ----- Small helpers: find fields, read values, and display safe text. -----

// Find an HTML element by its id. Example: byId('price') finds the price input.
function byId(id) {
  return document.getElementById(id);
}

// Read and trim a set of form fields. A prefix lets checkout use purchase-name, etc.
function readFields(fields, prefix = '') {
  const values = {};
  for (const field of fields) values[field] = byId(prefix + field).value.trim();
  return values;
}

// Escape user text before placing it inside generated HTML.
function escapeHTML(value) {
  const characters = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, (character) => characters[character]);
}

// Read an array from browser storage; fall back safely if it is missing or broken.
function readStore(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

// Save an array. Return false on failure so forms can keep the user's entered data.
function writeStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    showToast('Could not save. Browser storage is blocked or full.');
    return false;
  }
}

// Only load listings with the basic fields needed for displaying a card.
function getListings() {
  return readStore(STORE.listings, SAMPLE_PRODUCTS).filter(
    (product) =>
      product &&
      typeof product.id === 'string' &&
      typeof product.title === 'string' &&
      CATEGORIES.includes(product.category) &&
      Number.isFinite(product.price) &&
      product.price > 0
  );
}

// Treat purchased items as sold, without changing the seller's separate sold flag.
function getProducts() {
  const purchasedIds = getPurchases()
    .filter((order) => order.status !== 'cancelled')
    .map((order) => order.productId);
  return getListings().map((product) => ({
    ...product,
    sold: product.sold || purchasedIds.includes(product.id)
  }));
}

// Saved favourites are product IDs, rather than duplicate product objects.
function getSaved() {
  return readStore(STORE.saved, []).filter((id) => typeof id === 'string');
}

// Allow only our illustrations or uploaded image data; use a fallback otherwise.
function safeImage(image, category) {
  if (
    typeof image === 'string' &&
    (/^assets\/(chair|headphones|bicycle|camera|lamp|books|sneakers|monitor)\.svg$/.test(image) ||
      /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image))
  )
    return image;
  return 'assets/' + (ART[category] || 'chair') + '.svg';
}

// Show prices in rupees and dates in a short, readable format.
function money(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}
function dateLabel(time) {
  const date = new Date(time);
  return Number.isNaN(date.getTime())
    ? 'Recently'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Make a unique ID for a new listing, enquiry, report, or purchase.
function newId(prefix) {
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  return prefix + '-' + id;
}

// Show a brief notification at the bottom of the page.
let toastTimer;
function showToast(message) {
  const box = byId('toast');
  if (!box) return;
  clearTimeout(toastTimer);
  box.textContent = message;
  box.hidden = false;
  toastTimer = setTimeout(() => {
    box.hidden = true;
  }, 4500);
}

// Show a form error without clearing entered values.
function showError(id, message) {
  byId(id).textContent = message;
  byId(id).hidden = false;
}

// ----- Shared page layout. Edit this one function to change every page's menu. -----
function initLayout() {
  byId('site-header').innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html" aria-label="ReLoop home"><span class="brand-mark" aria-hidden="true">↻</span>reloop<span class="brand-dot">.</span></a>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="list.html">Browse</a>
        <a href="mylistings.html">My listings</a><a href="purchases.html">My purchases</a>
        <a href="saved.html">Saved <span class="saved-count" hidden></span></a>
        <a href="messages.html">Enquiries</a><a href="guide.html">Guide</a>
        <a class="nav-sell" href="sell.html">+ Sell an item</a>
      </nav>
    </div>`;
  byId('site-footer').innerHTML = `
    <div class="footer-inner"><a class="brand" href="index.html">reloop.</a>
      <span>Useful things deserve another chapter.</span><a href="guide.html">Trading guide ↗</a></div>
    <p class="footer-note">ReLoop · Browser demo · Data stays on this device</p>`;
  let current = document.body.dataset.page + '.html';
  if (current === 'index.html') current = 'list.html';
  document.querySelectorAll('.main-nav a').forEach((link) => {
    if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'page');
  });
}

// Update the favourite count shown in the shared menu.
function updateSavedCount() {
  const products = getProducts();
  const count = getSaved().filter((id) => products.some((product) => product.id === id)).length;
  const badge = document.querySelector('.saved-count');
  if (badge) {
    badge.textContent = count;
    badge.hidden = count === 0;
  }
}

// Build a text Save button. aria-pressed tells keyboard/screen-reader users its state.
function saveButton(product) {
  const saved = getSaved().includes(product.id);
  return `<button type="button" class="save-button" data-save="${escapeHTML(product.id)}"
    aria-pressed="${saved}" aria-label="${saved ? 'Unsave' : 'Save'} ${escapeHTML(product.title)}">${saved ? 'Saved' : 'Save'}</button>`;
}

// Build one product card. Extra edit/sold/delete actions appear only for your items.
function productCard(product, own = false) {
  const id = escapeHTML(product.id);
  const link = 'product.html?id=' + encodeURIComponent(product.id);
  let ownerActions = '';
  if (own) {
    ownerActions = `<div class="owner-actions">
      <a href="sell.html?edit=${encodeURIComponent(product.id)}">Edit</a>
      <button type="button" data-toggle-sold="${id}">${product.sold ? 'Relist item' : 'Mark as sold'}</button>
      <button type="button" class="delete-button" data-delete="${id}">Delete</button>
    </div>`;
  }
  return `<article class="product-card">
    <div class="product-image">
      <a href="${link}" tabindex="-1" aria-hidden="true"><img src="${escapeHTML(safeImage(product.image, product.category))}" alt="" loading="lazy"></a>
      ${product.sold ? '<span class="sold-ribbon">SOLD</span>' : ''}
    </div>
    <div class="product-info">
      <p class="card-category">${escapeHTML(product.category)} · ${escapeHTML(product.condition)}</p>
      <h3><a href="${link}">${escapeHTML(product.title)}</a></h3>
      <p class="product-price">${money(product.price)}</p>
      <p class="product-meta"><span>${escapeHTML(product.city)}</span><span class="listing-type">${product.owner === 'you' ? 'Your listing' : 'Demo listing'}</span></p>
      ${saveButton(product)}
    </div>${ownerActions}
  </article>`;
}

// Save or remove a favourite, then refresh the visible buttons and count.
function toggleSaved(id) {
  if (!getProducts().some((product) => product.id === id)) return;
  const saved = getSaved();
  const active = saved.includes(id);
  const updated = active ? saved.filter((item) => item !== id) : [...saved, id];
  if (!writeStore(STORE.saved, updated)) return;
  refreshPage();
  showToast(active ? 'Removed from saved items.' : 'Item saved.');
}

// ----- Browsing: the same controls work on the home and browse pages. -----

// Add category options from one list, so you only change CATEGORIES at the top.
function fillCategories(id) {
  for (const category of CATEGORIES) byId(id).add(new Option(category, category));
}

// Filter available products, sort them, and display matching cards.
function renderProducts() {
  const query = byId('search').value.trim().toLowerCase();
  const category = byId('browse-category').value;
  const city = byId('location').value;
  const products = getProducts().filter((product) => {
    const text = [product.title, product.description, product.category, product.city]
      .join(' ')
      .toLowerCase();
    return (
      !product.sold &&
      (category === 'all' || product.category === category) &&
      (city === 'all' || product.city === city) &&
      text.includes(query)
    );
  });
  products.sort((a, b) => {
    if (byId('sort').value === 'low') return a.price - b.price;
    if (byId('sort').value === 'high') return b.price - a.price;
    return b.createdAt - a.createdAt;
  });
  byId('product-grid').innerHTML = products.map((product) => productCard(product)).join('');
  byId('result-count').textContent = products.length + ' available products';
  byId('empty-state').hidden = products.length !== 0;
}

// Add new listing cities without resetting the selected filter.
function updateCities() {
  const select = byId('location');
  for (const product of getProducts()) {
    if (
      product.city &&
      !Array.from(select.options).some((option) => option.value === product.city)
    ) {
      select.add(new Option(product.city, product.city));
    }
  }
}

// Listen once on the filter form; each change updates the product grid.
function initBrowse() {
  fillCategories('browse-category');
  byId('search-form').addEventListener('input', renderProducts);
  byId('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    renderProducts();
  });
  byId('reset-filters').addEventListener('click', () => {
    byId('search-form').reset();
    renderProducts();
  });
}

// ----- Selling: create/edit listings and optionally read a photo. -----
let editingProduct = null;
let selectedPhoto = null;
let photoLoading = false;

// Fill the sell form for editing, then connect the photo and submit handlers.
function initSell() {
  fillCategories('category');
  const editId = new URLSearchParams(window.location.search).get('edit');
  editingProduct = getListings().find(
    (product) => product.id === editId && product.owner === 'you'
  );
  if (editId && !editingProduct)
    showError('form-error', 'This listing cannot be edited. You can create a new one below.');
  if (editingProduct) {
    for (const field of LISTING_FIELDS) byId(field).value = editingProduct[field];
    byId('honesty').checked = true;
    byId('sell-title').textContent = 'Edit listing';
    byId('submit-listing').textContent = 'Save changes';
    byId('photo-preview').src = safeImage(editingProduct.image, editingProduct.category);
    byId('photo-preview').hidden = false;
  }
  byId('photo').addEventListener('change', loadPhoto);
  byId('sell-form').addEventListener('submit', saveListing);
}

// Validate and decode an image before saving it. Disable upload while it is loading.
function loadPhoto() {
  const input = byId('photo');
  const file = input.files[0];
  selectedPhoto = null;
  byId('photo-preview').hidden = true;
  byId('form-error').hidden = true;
  if (!file) return;
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  ) {
    showError('form-error', 'Choose a JPG, PNG, or WebP image up to 2 MB.');
    input.value = '';
    return;
  }
  photoLoading = true;
  input.disabled = byId('submit-listing').disabled = true;
  const reader = new FileReader();
  reader.onerror = () => finishPhoto(null);
  reader.onload = () => {
    const image = new Image();
    image.onload = () => finishPhoto(reader.result);
    image.onerror = () => finishPhoto(null);
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

// Re-enable the form and display the photo, or a readable upload error.
function finishPhoto(data) {
  photoLoading = false;
  byId('photo').disabled = byId('submit-listing').disabled = false;
  if (!data) {
    byId('photo').value = '';
    showError('form-error', 'Could not open that image. Choose another photo.');
    return;
  }
  selectedPhoto = data;
  byId('photo-preview').src = data;
  byId('photo-preview').hidden = false;
}

// Validate trimmed values and save a new listing or update the existing one.
function saveListing(event) {
  event.preventDefault();
  if (photoLoading || !byId('sell-form').reportValidity()) return;
  const data = readFields(LISTING_FIELDS);
  data.price = Number(data.price);
  if (
    !data.title ||
    !data.city ||
    !data.seller ||
    data.description.length < 15 ||
    !CATEGORIES.includes(data.category) ||
    !['Like new', 'Good', 'Fair'].includes(data.condition) ||
    !Number.isInteger(data.price) ||
    data.price < 1 ||
    data.price > 10000000 ||
    !byId('honesty').checked
  ) {
    showError(
      'form-error',
      'Complete every field. Use at least 15 description characters and a whole-rupee price from ₹1 to ₹1,00,00,000.'
    );
    return;
  }
  const products = getListings();
  const index = editingProduct
    ? products.findIndex((product) => product.id === editingProduct.id && product.owner === 'you')
    : -1;
  if (editingProduct && index === -1) {
    showError(
      'form-error',
      'This listing was deleted in another tab. Create a new listing instead.'
    );
    return;
  }
  const previous = products[index];
  const product = {
    ...data,
    id: previous ? previous.id : newId('item'),
    owner: 'you',
    image: selectedPhoto || (previous ? previous.image : safeImage(null, data.category)),
    sold: previous ? previous.sold : false,
    createdAt: previous ? previous.createdAt : Date.now()
  };
  if (previous) products[index] = product;
  else products.unshift(product);
  if (writeStore(STORE.listings, products))
    window.location.href = 'mylistings.html?success=' + (previous ? 'edited' : 'created');
  else
    showError(
      'form-error',
      'Your listing was not saved. Storage may be blocked or full. Try a smaller photo.'
    );
}

// ----- Product details, local enquiries, and reports. -----

// Read the product ID from the URL and display its details and available actions.
function renderDetail() {
  const id = new URLSearchParams(window.location.search).get('id');
  const product = getProducts().find((item) => item.id === id);
  if (!product) {
    byId('product-detail').innerHTML =
      '<p class="empty-state">Listing not found. <a href="list.html">Browse products.</a></p>';
    return;
  }
  document.title = product.title + ' | ReLoop';
  let actions = '';
  if (product.owner === 'you') {
    actions = `<a class="button" href="sell.html?edit=${encodeURIComponent(id)}">Edit your listing</a>`;
  } else if (product.sold) {
    actions = '<p>This item has been sold.</p>';
    if (getPurchases().some((order) => order.productId === id && order.status !== 'cancelled')) {
      actions += '<a href="purchases.html">View your purchase</a>';
    }
  } else {
    actions = `<button type="button" data-purchase="${escapeHTML(id)}">Buy now · ${money(product.price)}</button>
      <button class="button-outline" type="button" id="contact-button">Contact seller</button>`;
  }
  byId('product-detail').innerHTML = `<article class="detail-layout">
    <div class="detail-photo"><img src="${escapeHTML(safeImage(product.image, product.category))}" alt="${escapeHTML(product.title)}">
      ${product.sold ? '<span class="sold-ribbon">SOLD</span>' : ''}</div>
    <div><p class="muted">${escapeHTML(product.category)} · ${escapeHTML(product.condition)}</p>
      <h1>${escapeHTML(product.title)}</h1><p class="detail-price">${money(product.price)}</p>
      <p>${escapeHTML(product.city)} · Seller: ${escapeHTML(product.seller)}</p>
      <p class="description">${escapeHTML(product.description)}</p>
      <p class="muted">${product.owner === 'you' ? 'Your listing' : 'Demo listing · Sample seller'}</p>
      ${saveButton(product)}<div class="detail-actions">${actions}</div>
      <p class="notice">Demo purchase only. For real trades, meet in public and inspect before paying.</p>
      <button type="button" class="button-outline" id="report-button">Report listing</button>
    </div></article>`;
  const contact = byId('contact-button');
  if (contact)
    contact.addEventListener('click', () => {
      byId('contact-product').textContent = product.title;
      byId('contact-dialog').showModal();
    });
  byId('report-button').addEventListener('click', () => byId('report-dialog').showModal());
  return product;
}

// The enquiry/report forms are connected once; re-rendering details won't duplicate them.
function initDetail() {
  byId('contact-form').addEventListener('submit', saveEnquiry);
  byId('report-form').addEventListener('submit', saveReport);
}

// Save a local enquiry. This app never delivers messages to another person.
function saveEnquiry(event) {
  event.preventDefault();
  const product = getProducts().find(
    (item) => item.id === new URLSearchParams(window.location.search).get('id')
  );
  const buyer = byId('buyer-name').value.trim();
  const message = byId('enquiry').value.trim();
  if (!product || !buyer || message.length < 5) {
    showError('contact-error', 'Add your name and a message of at least 5 characters.');
    return;
  }
  const enquiries = readStore(STORE.messages, []);
  enquiries.unshift({
    id: newId('enquiry'),
    productId: product.id,
    title: product.title,
    image: product.image,
    category: product.category,
    seller: product.seller,
    buyer,
    message,
    createdAt: Date.now()
  });
  if (writeStore(STORE.messages, enquiries)) window.location.href = 'messages.html?success=sent';
  else
    showError(
      'contact-error',
      'Could not save your enquiry. Browser storage may be blocked or full.'
    );
}

// Save a local report; it can be read at the bottom of My listings.
function saveReport(event) {
  event.preventDefault();
  const product = getProducts().find(
    (item) => item.id === new URLSearchParams(window.location.search).get('id')
  );
  const reason = byId('report-reason').value;
  if (!product || !reason) return;
  const reports = readStore(STORE.reports, []);
  reports.unshift({
    id: newId('report'),
    productId: product.id,
    title: product.title,
    reason,
    details: byId('report-details').value.trim(),
    createdAt: Date.now()
  });
  if (!writeStore(STORE.reports, reports)) {
    showError(
      'report-error',
      'Could not save this report. Browser storage may be blocked or full.'
    );
    return;
  }
  byId('report-dialog').close();
  byId('report-form').reset();
  showToast('Report saved under My listings.');
}

// ----- Purchases: one saved receipt also controls item availability. -----
let purchaseContext = null;

// Keep one summary format for both opening checkout and checking a changed price.
function purchaseSummary(product) {
  return product.title + ' · Total: ' + money(product.price) + ' (no demo fees)';
}

// Load valid purchase records; malformed storage should not break the page.
function getPurchases() {
  return readStore(STORE.purchases, []).filter(function (order) {
    return (
      order &&
      typeof order.id === 'string' &&
      typeof order.productId === 'string' &&
      Object.hasOwn(PURCHASE_STATUS, order.status) &&
      order.product &&
      typeof order.product.title === 'string' &&
      Number.isFinite(order.product.price) &&
      order.buyer &&
      typeof order.buyer.name === 'string'
    );
  });
}

// Create checkout once for the product and purchase-history pages.
function initPurchaseDialog() {
  document.body.insertAdjacentHTML(
    'beforeend',
    `
        <dialog id="purchase-dialog" aria-labelledby="purchase-title" aria-describedby="purchase-note">
            <form id="purchase-form">
                <button type="button" class="dialog-close" data-close-dialog aria-label="Close purchase form">×</button>
                <h2 id="purchase-title">Purchase details</h2>
                <p id="purchase-summary" class="purchase-summary"></p>
                <p id="purchase-note" class="demo-note">This is a demo purchase. No money is charged and no seller is contacted. Details stay in this browser; use sample contact details.</p>
                <label for="purchase-name">Full name *</label>
                <input id="purchase-name" name="name" autocomplete="name" required minlength="2" maxlength="80">
                <label for="purchase-email">Email *</label>
                <input id="purchase-email" name="email" type="email" autocomplete="email" required maxlength="120">
                <label for="purchase-phone">Phone number *</label>
                <input id="purchase-phone" name="phone" type="tel" autocomplete="tel" required minlength="7" maxlength="25" aria-describedby="purchase-phone-hint">
                <small id="purchase-phone-hint" class="muted">Use 7–15 digits; an optional country code is welcome.</small>
                <label for="purchase-method">How would you like to receive it? *</label>
                <select id="purchase-method" name="method" required>
                    <option value="pickup">Collect in person</option>
                    <option value="delivery">Delivery</option>
                </select>
                <label id="purchase-location-label" for="purchase-location">Public meetup location and city *</label>
                <textarea id="purchase-location" name="location" required minlength="5" maxlength="300" rows="3"></textarea>
                <label for="purchase-notes">Notes (optional)</label>
                <textarea id="purchase-notes" name="notes" maxlength="500" rows="2" placeholder="Preferred time or any collection instructions"></textarea>
                <p id="purchase-payment" class="demo-note">Payment method: pay on collection after inspection (demo only).</p>
                <p id="purchase-error" class="form-error" role="alert" hidden></p>
                <button id="purchase-submit" class="button full-width" type="submit">Confirm demo purchase</button>
            </form>
        </dialog>
    `
  );
  byId('purchase-method').addEventListener('change', updateFulfilmentLabel);
  byId('purchase-form').addEventListener('submit', savePurchase);
  byId('purchase-dialog').addEventListener('close', function () {
    purchaseContext = null;
  });
}

// Switch the location label and payment explanation when delivery changes.
function updateFulfilmentLabel() {
  const delivery = byId('purchase-method').value === 'delivery';
  byId('purchase-location-label').textContent = delivery
    ? 'Delivery address and city *'
    : 'Public meetup location and city *';
  byId('purchase-location').placeholder = delivery
    ? 'Sample street address, city and postal code'
    : 'A busy public place and city';
  byId('purchase-payment').textContent = delivery
    ? 'Payment method: cash on delivery (demo only). Delivery is not arranged by this app.'
    : 'Payment method: pay on collection after inspection (demo only).';
}

// Open a new purchase or fill the same form to edit a pending one.
function openPurchase(productId, orderId = null) {
  const order = orderId ? getPurchases().find((item) => item.id === orderId) : null;
  const product = order ? order.product : getProducts().find((item) => item.id === productId);
  if (orderId && (!order || order.status !== 'placed')) {
    showToast('Only purchases awaiting collection or delivery can be edited.');
    renderPurchases();
    return;
  }
  if (!product || (!order && (product.sold || product.owner === 'you'))) {
    showToast('This item is no longer available to purchase.');
    return;
  }
  purchaseContext = { productId: order ? order.productId : product.id, orderId };
  const form = byId('purchase-form');
  form.reset();
  byId('purchase-error').hidden = true;
  byId('purchase-title').textContent = order ? 'Edit purchase details' : 'Purchase details';
  byId('purchase-summary').textContent = purchaseSummary(product);
  byId('purchase-submit').textContent = order ? 'Save purchase details' : 'Confirm demo purchase';
  if (order) {
    BUYER_FIELDS.forEach(function (field) {
      byId('purchase-' + field).value = order.buyer[field] || '';
    });
  }
  updateFulfilmentLabel();
  byId('purchase-dialog').showModal();
}

// Validate buyer data, recheck availability, then save one receipt to storage.
function savePurchase(event) {
  event.preventDefault();
  const form = byId('purchase-form');
  if (!purchaseContext || !form.reportValidity()) return;
  const buyer = readFields(BUYER_FIELDS, 'purchase-');
  const digits = buyer.phone.replace(/\D/g, '');
  if (
    buyer.name.length < 2 ||
    buyer.name.length > 80 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email) ||
    buyer.email.length > 120 ||
    !/^\+?[0-9 ()-]+$/.test(buyer.phone) ||
    digits.length < 7 ||
    digits.length > 15 ||
    !['pickup', 'delivery'].includes(buyer.method) ||
    buyer.location.length < 5 ||
    buyer.location.length > 300 ||
    buyer.notes.length > 500
  ) {
    showError(
      'purchase-error',
      'Enter your full name, a valid email, a phone number with 7–15 digits, and a location of at least 5 characters.'
    );
    return;
  }
  // Re-read on submit: another tab may have bought or changed the item.
  const orders = getPurchases();
  const { productId, orderId } = purchaseContext;
  const now = Date.now();
  if (orderId) {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.status !== 'placed') {
      showError(
        'purchase-error',
        'This purchase has changed. Close the form and refresh your purchases.'
      );
      return;
    }
    order.buyer = buyer;
    order.updatedAt = now;
  } else {
    const product = getProducts().find((item) => item.id === productId);
    if (!product || product.sold || product.owner === 'you') {
      showError(
        'purchase-error',
        'This item is no longer available. Close the form to browse another find.'
      );
      return;
    }
    // Require a fresh confirmation if the displayed item or price changed.
    const summary = byId('purchase-summary');
    const currentSummary = purchaseSummary(product);
    if (summary.textContent !== currentSummary) {
      summary.textContent = currentSummary;
      showError(
        'purchase-error',
        'The listing changed. Review the updated item and price, then confirm again.'
      );
      return;
    }
    orders.unshift({
      id: newId('purchase'),
      productId,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        category: product.category,
        condition: product.condition,
        image: product.image,
        seller: product.seller,
        city: product.city
      },
      buyer,
      status: 'placed',
      createdAt: now,
      updatedAt: now
    });
  }
  if (!writeStore(STORE.purchases, orders)) {
    showError(
      'purchase-error',
      'Your purchase was not saved. Browser storage is blocked or full. Your details are still here; free some space and try again.'
    );
    return;
  }
  byId('purchase-dialog').close();
  if (orderId) {
    renderPurchases();
    showToast('Purchase details updated.');
  } else {
    window.location.href = 'purchases.html?success=purchased';
  }
}

// Display purchase snapshots even when their original listing has changed or gone.
function renderPurchases() {
  const orders = getPurchases().sort((a, b) => b.createdAt - a.createdAt);
  const products = getProducts();
  byId('purchases-list').innerHTML = orders
    .map((order) => {
      const product = order.product;
      const buyer = order.buyer;
      const id = escapeHTML(order.id);
      let actions = '';
      if (order.status === 'placed') {
        actions = `<button type="button" data-edit-purchase="${id}">Edit details</button>
        <button type="button" class="button-outline" data-receive-purchase="${id}">Mark as received</button>
        <button type="button" class="delete-button" data-cancel-purchase="${id}">Cancel purchase</button>`;
      }
      let link = '<span class="muted">Original listing removed; your purchase is saved.</span>';
      if (products.some((item) => item.id === order.productId))
        link = `<a href="product.html?id=${encodeURIComponent(order.productId)}">View listing</a>`;
      return `<article class="purchase-card">
      <img src="${escapeHTML(safeImage(product.image, product.category))}" alt="${escapeHTML(product.title)}" loading="lazy">
      <div><h2>${escapeHTML(product.title)}</h2>
        <span class="badge purchase-status-${order.status}">${PURCHASE_STATUS[order.status]}</span>
        <p class="purchase-price">${money(product.price)}</p><p>Seller: ${escapeHTML(product.seller)}</p>
        <p class="message-meta">Order ${id} · Purchased ${dateLabel(order.createdAt)} · Updated ${dateLabel(order.updatedAt)}</p>
        <dl class="purchase-details">
          <div><dt>Buyer</dt><dd>${escapeHTML(buyer.name)}</dd></div>
          <div><dt>Email</dt><dd>${escapeHTML(buyer.email)}</dd></div>
          <div><dt>Phone</dt><dd>${escapeHTML(buyer.phone)}</dd></div>
          <div><dt>${buyer.method === 'delivery' ? 'Delivery address' : 'Meetup location'}</dt><dd>${escapeHTML(buyer.location)}</dd></div>
          <div><dt>Payment</dt><dd>${buyer.method === 'delivery' ? 'Cash on delivery' : 'Pay on collection'} · Demo, no charge</dd></div>
          ${buyer.notes ? `<div><dt>Notes</dt><dd>${escapeHTML(buyer.notes)}</dd></div>` : ''}
        </dl><div class="purchase-actions">${actions}${link}</div>
      </div></article>`;
    })
    .join('');
  byId('purchases-empty').hidden = orders.length !== 0;
  byId('purchase-count').textContent = orders.length + ' saved purchases';
}

// Complete or cancel a pending purchase, after asking the user to confirm.
function updatePurchaseStatus(id, status) {
  if (!['received', 'cancelled'].includes(status)) return;
  const orders = getPurchases();
  const order = orders.find((item) => item.id === id);
  if (!order || order.status !== 'placed') {
    renderPurchases();
    showToast('This purchase has already been updated.');
    return;
  }
  const message =
    status === 'cancelled'
      ? 'Cancel the purchase of “' +
        order.product.title +
        '”? The item will become available again if the listing still exists.'
      : 'Mark “' + order.product.title + '” as received? Its details will no longer be editable.';
  if (!window.confirm(message)) return;
  // Confirmation can stay open while another tab changes purchase history.
  const latestOrders = getPurchases();
  const latestOrder = latestOrders.find((item) => item.id === id);
  if (!latestOrder || latestOrder.status !== 'placed') {
    renderPurchases();
    showToast('This purchase has already been updated.');
    return;
  }
  latestOrder.status = status;
  latestOrder.updatedAt = Date.now();
  if (!writeStore(STORE.purchases, latestOrders)) return;
  renderPurchases();
  showToast(
    status === 'cancelled'
      ? 'Purchase cancelled. The record stays in your history.'
      : 'Marked as received. Enjoy your find!'
  );
}

// ----- Your listings, favourites, enquiries, and local reports. -----

// Show your own listing cards, counts, and saved reports.
function renderMyListings() {
  const products = getProducts()
    .filter((product) => product.owner === 'you')
    .sort((a, b) => b.createdAt - a.createdAt);
  byId('my-listings').innerHTML = products.map((product) => productCard(product, true)).join('');
  byId('my-empty').hidden = products.length !== 0;
  byId('stat-active').textContent = products.filter((product) => !product.sold).length;
  byId('stat-sold').textContent = products.filter((product) => product.sold).length;
  byId('stat-enquiries').textContent = readStore(STORE.messages, []).filter(
    (message) => message && products.some((product) => product.id === message.productId)
  ).length;
  const reports = readStore(STORE.reports, []).filter(
    (report) => report && typeof report.title === 'string'
  );
  byId('reports-list').innerHTML =
    reports
      .map(
        (report) => `<article class="report-record">
    <strong>${escapeHTML(report.title)}</strong><p>${escapeHTML(report.reason)} · ${escapeHTML(report.details)}</p>
    <small>${dateLabel(report.createdAt)} · Saved locally</small></article>`
      )
      .join('') || '<p>No reports saved.</p>';
}

// Change a seller's sold flag. A saved purchase must not be relisted this way.
function toggleSold(id) {
  const products = getListings();
  const product = products.find((item) => item.id === id && item.owner === 'you');
  if (!product) return;
  if (getPurchases().some((order) => order.productId === id && order.status !== 'cancelled')) {
    showToast('This item has a saved purchase and cannot be relisted.');
    return;
  }
  product.sold = !product.sold;
  if (writeStore(STORE.listings, products)) {
    renderMyListings();
    showToast(product.sold ? 'Item marked sold.' : 'Item available again.');
  }
}

// Delete only your own listing. Purchase snapshots remain in purchase history.
function deleteListing(id) {
  const product = getListings().find((item) => item.id === id && item.owner === 'you');
  if (!product || !window.confirm('Delete “' + product.title + '”?')) return;
  const products = getListings().filter((item) => item.id !== id);
  if (!writeStore(STORE.listings, products)) return;
  writeStore(
    STORE.saved,
    getSaved().filter((savedId) => savedId !== id)
  );
  refreshPage();
  showToast('Listing deleted.');
}

// Display favourite products, including sold items, so saved finds remain visible.
function renderSaved() {
  const saved = getSaved();
  const products = getProducts().filter((product) => saved.includes(product.id));
  byId('saved-grid').innerHTML = products.map((product) => productCard(product)).join('');
  byId('saved-empty').hidden = products.length !== 0;
}

// Display local enquiries and link back to a listing if it still exists.
function renderMessages() {
  const messages = readStore(STORE.messages, []).filter(
    (message) => message && typeof message.title === 'string'
  );
  const products = getProducts();
  byId('messages-list').innerHTML = messages
    .map((message) => {
      const exists = products.some((product) => product.id === message.productId);
      return `<article class="message-card">
      <img src="${escapeHTML(safeImage(message.image, message.category))}" alt="" loading="lazy">
      <div><h2>${escapeHTML(message.title)}</h2><p>${escapeHTML(message.buyer)} → ${escapeHTML(message.seller)}</p>
        <p class="description">${escapeHTML(message.message)}</p><p class="message-meta">${dateLabel(message.createdAt)} · Saved locally, not delivered</p>
        ${exists ? `<a href="product.html?id=${encodeURIComponent(message.productId)}">View listing</a>` : '<p>Listing no longer available.</p>'}
      </div></article>`;
    })
    .join('');
  byId('messages-empty').hidden = messages.length !== 0;
}

// ----- Start the correct page and handle shared buttons. -----

// Refresh just the current page's content; forms and their listeners stay intact.
function refreshPage() {
  const page = document.body.dataset.page;
  updateSavedCount();
  if (page === 'index' || page === 'list') {
    updateCities();
    renderProducts();
  }
  if (page === 'product') renderDetail();
  if (page === 'purchases') renderPurchases();
  if (page === 'mylistings') renderMyListings();
  if (page === 'saved') renderSaved();
  if (page === 'messages') renderMessages();
}

// A single click handler also works for buttons added after filtering or saving.
function handleClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  if (data.save) toggleSaved(data.save);
  if (data.toggleSold) toggleSold(data.toggleSold);
  if (data.delete) deleteListing(data.delete);
  if (data.purchase) openPurchase(data.purchase);
  if (data.editPurchase) openPurchase(null, data.editPurchase);
  if (data.receivePurchase) updatePurchaseStatus(data.receivePurchase, 'received');
  if (data.cancelPurchase) updatePurchaseStatus(data.cancelPurchase, 'cancelled');
  if (button.hasAttribute('data-close-dialog')) button.closest('dialog').close();
}

// Wait until the HTML is loaded, then initialize the shared layout and page forms.
document.addEventListener('DOMContentLoaded', () => {
  initLayout();
  const page = document.body.dataset.page;
  if (page === 'index' || page === 'list') initBrowse();
  if (page === 'sell') initSell();
  if (page === 'product') initDetail();
  if (page === 'product' || page === 'purchases') initPurchaseDialog();
  refreshPage();
  document.addEventListener('click', handleClick);
  const messages = {
    created: 'Listing created.',
    edited: 'Listing updated.',
    sent: 'Enquiry saved locally. No message was sent.',
    purchased: 'Purchase saved. No payment was charged.'
  };
  const url = new URL(window.location.href);
  const success = url.searchParams.get('success');
  if (messages[success]) showToast(messages[success]);
  if (success) {
    url.searchParams.delete('success');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
});

// Keep open tabs in sync after any ReLoop storage change, including a demo reset.
window.addEventListener('storage', (event) => {
  if (event.key === null || Object.values(STORE).includes(event.key)) refreshPage();
});
