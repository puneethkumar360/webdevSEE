const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const source = readFileSync(join(__dirname, '..', 'myapp.js'), 'utf8');
const purchaseKey = 'reloop.purchases.v1';
const listingKey = 'reloop.listings.v1';

// A small browser fixture exercises the actual shared script and storage writes.
// Native HTML validation, layout, and keyboard behaviour are checked in a browser.
function createApp(storage = new Map()) {
  const elements = new Map();
  const writes = [];
  let blocked = false;
  let confirmResult = true;
  let onConfirm = null;

  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        value: id === 'purchase-method' ? 'pickup' : '',
        textContent: '',
        innerHTML: '',
        hidden: false,
        open: false,
        addEventListener() {},
        reportValidity: () => true,
        showModal() {
          this.open = true;
        },
        close() {
          this.open = false;
        },
        reset() {
          for (const [key, field] of elements) {
            if (key.startsWith('purchase-')) field.value = '';
          }
          element('purchase-method').value = 'pickup';
        }
      });
    }
    return elements.get(id);
  }

  const context = vm.createContext({
    console,
    URL,
    URLSearchParams,
    crypto: webcrypto,
    setTimeout: () => 1,
    clearTimeout() {},
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem(key, value) {
        if (blocked) throw new Error('Storage unavailable');
        writes.push(key);
        storage.set(key, value);
      }
    },
    document: {
      body: { dataset: { page: 'purchases' }, insertAdjacentHTML() {} },
      getElementById: element,
      addEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => []
    },
    window: {
      location: { search: '', href: '', pathname: '/purchases.html' },
      addEventListener() {},
      confirm: () => {
        if (onConfirm) onConfirm();
        return confirmResult;
      }
    }
  });
  vm.runInContext(source, context);

  return {
    storage,
    writes,
    element,
    run: (code) => vm.runInContext(code, context),
    read: (code) => {
      const value = vm.runInContext(code, context);
      return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    },
    blockStorage(value = true) {
      blocked = value;
    },
    confirm(value) {
      confirmResult = value;
    },
    onConfirm(callback) {
      onConfirm = callback;
    },
    open(id = 'demo-chair') {
      vm.runInContext(`openPurchase(${JSON.stringify(id)})`, context);
    },
    fill(overrides = {}) {
      const buyer = {
        name: 'Demo Buyer',
        email: 'buyer@example.com',
        phone: '+91 98765 43210',
        method: 'pickup',
        location: 'Central Library, Bengaluru',
        notes: 'Saturday afternoon',
        ...overrides
      };
      for (const [key, value] of Object.entries(buyer)) element(`purchase-${key}`).value = value;
    },
    submit() {
      vm.runInContext('savePurchase({ preventDefault() {} })', context);
    }
  };
}

function checkout(app, buyer) {
  app.open();
  app.fill(buyer);
  app.submit();
  return app.read('getPurchases()[0]');
}

function changeStatus(app, id, status) {
  app.run(`updatePurchaseStatus(${JSON.stringify(id)}, ${JSON.stringify(status)})`);
}

test('checkout saves buyer details and a receipt in one write, and marks the item sold', () => {
  const app = createApp();
  const order = checkout(app);
  assert.equal(order.productId, 'demo-chair');
  assert.equal(order.product.price, 3200);
  assert.equal(order.buyer.name, 'Demo Buyer');
  assert.equal(order.buyer.method, 'pickup');
  assert.equal(order.status, 'placed');
  assert.deepEqual(app.writes, [purchaseKey]);
  assert.equal(app.read("getProducts().find(item => item.id === 'demo-chair').sold"), true);
  assert.equal(app.read("getListings().find(item => item.id === 'demo-chair').sold"), false);
  assert.equal(app.run('window.location.href'), 'purchases.html?success=purchased');
});

test('purchase and availability survive a fresh page load', () => {
  const first = createApp();
  const order = checkout(first);
  const reloaded = createApp(first.storage);
  assert.deepEqual(reloaded.read('getPurchases()[0]'), order);
  assert.equal(reloaded.read("getProducts().find(item => item.id === 'demo-chair').sold"), true);
});

test('invalid and whitespace-only details do not save a purchase', () => {
  const invalidInputs = [
    { name: '   ' },
    { email: 'invalid-email' },
    { phone: '123456' },
    { phone: '1234567890123456' },
    { phone: '12+34567890' },
    { location: '    ' },
    { method: 'teleport' }
  ];
  for (const buyer of invalidInputs) {
    const app = createApp();
    checkout(app, buyer);
    assert.equal(app.read('getPurchases().length'), 0, JSON.stringify(buyer));
    assert.equal(app.element('purchase-error').hidden, false);
  }
});

test('storage failure retains entered details and does not change availability', () => {
  const app = createApp();
  app.open();
  app.fill();
  app.blockStorage();
  app.submit();
  assert.equal(app.read('getPurchases().length'), 0);
  assert.equal(app.read("getProducts().find(item => item.id === 'demo-chair').sold"), false);
  assert.equal(app.element('purchase-dialog').open, true);
  assert.equal(app.element('purchase-name').value, 'Demo Buyer');
  assert.match(app.element('purchase-error').textContent, /not saved/);
  app.blockStorage(false);
  app.submit();
  assert.equal(app.read('getPurchases().length'), 1);
});

test('stale checkout cannot buy an item already purchased in another tab', () => {
  const app = createApp();
  const otherTab = createApp(app.storage);
  app.open();
  app.fill();
  checkout(otherTab);
  app.submit();
  assert.equal(app.read('getPurchases().length'), 1);
  assert.match(app.element('purchase-error').textContent, /no longer available/);
});

test('missing, manually sold, and own listings cannot be purchased', () => {
  for (const kind of ['missing', 'sold', 'own']) {
    const app = createApp();
    const listings = app.read('getListings()');
    if (kind === 'missing') listings.shift();
    if (kind === 'sold') listings[0].sold = true;
    if (kind === 'own') listings[0].owner = 'you';
    app.storage.set(listingKey, JSON.stringify(listings));
    app.open();
    assert.equal(app.element('purchase-dialog').open, false, kind);
    assert.equal(app.read('getPurchases().length'), 0);
  }
});

test('changed price requires a fresh confirmation of the updated summary', () => {
  const app = createApp();
  app.open();
  app.fill();
  const products = app.read('getListings()');
  products[0].price = 3400;
  app.storage.set(listingKey, JSON.stringify(products));
  app.submit();
  assert.equal(app.read('getPurchases().length'), 0);
  assert.match(app.element('purchase-summary').textContent, /3,400/);
  app.submit();
  assert.equal(app.read('getPurchases()[0].product.price'), 3400);
});

test('editing updates buyer and delivery details without changing the receipt', () => {
  const app = createApp();
  const original = checkout(app);
  app.run(`openPurchase(null, ${JSON.stringify(original.id)})`);
  app.fill({
    name: 'Updated Buyer',
    method: 'delivery',
    location: '123 Sample Street, Bengaluru 560001'
  });
  app.submit();
  const updated = app.read('getPurchases()[0]');
  assert.equal(updated.buyer.name, 'Updated Buyer');
  assert.equal(updated.buyer.method, 'delivery');
  assert.equal(updated.buyer.location, '123 Sample Street, Bengaluru 560001');
  assert.deepEqual(updated.product, original.product);
  assert.equal(updated.id, original.id);
  assert.equal(updated.createdAt, original.createdAt);
  assert.equal(app.read('getPurchases().length'), 1);
});

test('receipt survives listing edits and deletion', () => {
  const app = createApp();
  const original = checkout(app);
  const listings = app.read('getListings()');
  listings[0].title = 'A different title';
  listings[0].price = 9999;
  app.storage.set(listingKey, JSON.stringify(listings));
  assert.deepEqual(app.read('getPurchases()[0].product'), original.product);
  app.storage.set(listingKey, JSON.stringify(listings.slice(1)));
  app.run('renderPurchases()');
  assert.match(app.element('purchases-list').innerHTML, /Original listing removed/);
  assert.deepEqual(app.read('getPurchases()[0].product'), original.product);
});

test('cancellation retains history and releases availability for another purchase', () => {
  const app = createApp();
  const order = checkout(app);
  changeStatus(app, order.id, 'cancelled');
  assert.equal(app.read('getPurchases()[0].status'), 'cancelled');
  assert.equal(app.read("getProducts().find(item => item.id === 'demo-chair').sold"), false);
  checkout(app);
  assert.equal(app.read('getPurchases().length'), 2);
  assert.equal(app.read("getProducts().find(item => item.id === 'demo-chair').sold"), true);
});

test('cancelling does not remove a separately marked sold flag', () => {
  const app = createApp();
  const order = checkout(app);
  const listings = app.read('getListings()');
  listings[0].sold = true;
  app.storage.set(listingKey, JSON.stringify(listings));
  changeStatus(app, order.id, 'cancelled');
  assert.equal(app.read("getProducts().find(item => item.id === 'demo-chair').sold"), true);
});

test('status changes preserve purchases saved while the confirmation was open', () => {
  const app = createApp();
  const order = checkout(app);
  const otherTab = createApp(app.storage);
  app.onConfirm(() => {
    otherTab.open('demo-books');
    otherTab.fill();
    otherTab.submit();
  });
  changeStatus(app, order.id, 'cancelled');
  assert.equal(app.read('getPurchases().length'), 2);
  assert.equal(
    app.read("getPurchases().find(order => order.productId === 'demo-books').status"),
    'placed'
  );
  assert.equal(
    app.read("getPurchases().find(order => order.productId === 'demo-chair').status"),
    'cancelled'
  );
});

test('received purchases stay sold and cannot be cancelled or edited', () => {
  const app = createApp();
  const order = checkout(app);
  changeStatus(app, order.id, 'received');
  changeStatus(app, order.id, 'cancelled');
  assert.equal(app.read('getPurchases()[0].status'), 'received');
  app.run(`openPurchase(null, ${JSON.stringify(order.id)})`);
  assert.equal(app.element('purchase-dialog').open, false);
  assert.equal(app.read("getProducts().find(item => item.id === 'demo-chair').sold"), true);
});

test('declining confirmation or failing a status write leaves the purchase intact', () => {
  const app = createApp();
  const order = checkout(app);
  app.confirm(false);
  changeStatus(app, order.id, 'cancelled');
  assert.equal(app.read('getPurchases()[0].status'), 'placed');
  app.confirm(true);
  app.blockStorage();
  changeStatus(app, order.id, 'received');
  assert.equal(app.read('getPurchases()[0].status'), 'placed');
});

test('purchase history escapes buyer input and renders it as text', () => {
  const app = createApp();
  checkout(app, { name: '<img src=x onerror=alert(1)>', notes: '<script>alert(1)</script>' });
  app.run('renderPurchases()');
  const html = app.element('purchases-list').innerHTML;
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('malformed purchase storage does not crash browsing', () => {
  for (const value of ['invalid json', '{}', '[null,{}, {"id": "bad"}]']) {
    const app = createApp(new Map([[purchaseKey, value]]));
    assert.equal(app.read('getPurchases().length'), 0);
    assert.equal(app.read('getProducts().length'), 8);
  }
});
