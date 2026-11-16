// Diamondverse — Diamond Store: real-money purchases (luxury jobs today; more products later).
//
// HOW IT WORKS
//   The game never talks to a payment processor directly. It calls Store.purchase(sku) and Store.restore().
//   The Store forwards those calls to a *provider adapter* (below), then records an *entitlement* in the save.
//   Owning an entitlement is what unlocks the product in-game (see applyEntitlements()).
//
// MODES  (PAYMENTS.mode)
//   'disabled' — store is visible, prices shown, Buy is turned off. (Default until a provider is connected.)
//   'sandbox'  — test purchases, no charge. Turn on by opening the game with #sandbox at the end of the URL.
//                Sandbox entitlements are ignored once mode is 'live'.
//   'live'     — real purchases through PAYMENTS.provider.
//
// CONNECTING A PROCESSOR LATER
//   Write an adapter with this shape and assign it to PAYMENTS.provider, then set mode to 'live':
//     {
//       name: 'stripe' | 'apple' | 'google' | ...,
//       async purchase(product, ctx) -> { ok:true, receipt:'...' } | { ok:false, reason:'cancelled' | 'failed', message }
//       async verify(receipt, product, ctx) -> boolean      // MUST call your server; never trust the client alone
//       async restore(ctx) -> [{ sku, receipt }]            // purchases already made on this account
//     }
//   ctx = { playerId } — a stable id for this save, so your server can tie receipts to a player.
//   Notes: web builds can use Stripe Checkout. If the game ships in the App Store / Google Play, digital items
//   must go through Apple In-App Purchase / Google Play Billing, so plan one adapter per platform.
//   Entitlements live in the browser save, which a player can edit; real enforcement belongs on your server.

const PAYMENTS = {
  mode: 'disabled',
  provider: null,
  currency: 'USD'
};
try { if (location.hash === '#sandbox' && PAYMENTS.mode !== 'live') PAYMENTS.mode = 'sandbox'; } catch (e) {}

// Product catalog, built from luxury jobs. Add other kinds (cosmetics, bundles) here later.
function storeProducts() {
  return Object.entries(DV.JOBS).filter(([, j]) => j.tier === 3).map(([id, j]) => ({
    sku: j.sku, kind: 'job', grants: id, name: j.name, price: j.price,
    priceLabel: new Intl.NumberFormat('en-US', { style: 'currency', currency: PAYMENTS.currency }).format(j.price),
    description: j.perk
  }));
}
const productBySku = sku => storeProducts().find(p => p.sku === sku);

function entitlementValid(e) { return !!e && (PAYMENTS.mode !== 'live' || e.source !== 'sandbox'); }
function ownsSku(sku) { return entitlementValid(S.entitlements[sku]); }

// Turn owned entitlements into game unlocks. Called on load and after every purchase/restore.
function applyEntitlements() {
  storeProducts().forEach(p => {
    const owned = ownsSku(p.sku);
    if (p.kind === 'job') {
      const has = S.jobsOwned.includes(p.grants);
      if (owned && !has) S.jobsOwned.push(p.grants);
      if (!owned && has) { S.jobsOwned = S.jobsOwned.filter(j => j !== p.grants); if (S.job === p.grants) S.job = null; }
    }
  });
}
function grantEntitlement(sku, receipt, source) {
  S.entitlements[sku] = { at: new Date().toISOString(), source, receipt };
  applyEntitlements(); save();
}

const Store = {
  mode: () => PAYMENTS.mode,
  canBuy: () => PAYMENTS.mode === 'sandbox' || (PAYMENTS.mode === 'live' && !!PAYMENTS.provider),
  async purchase(sku) {
    const product = productBySku(sku);
    if (!product) return { ok:false, message:'That item is no longer sold.' };
    if (ownsSku(sku)) return { ok:false, message:`You already own ${product.name}.` };
    if (PAYMENTS.mode === 'sandbox') {
      grantEntitlement(sku, 'sandbox-' + Date.now(), 'sandbox');
      return { ok:true, message:`Test purchase complete. ${product.name} unlocked (no charge).` };
    }
    if (!this.canBuy()) return { ok:false, message:'The Diamond Store opens soon. Purchases are not available yet.' };
    const ctx = { playerId: S.playerId };
    try {
      const res = await PAYMENTS.provider.purchase(product, ctx);
      if (!res || !res.ok) return { ok:false, message: res && res.reason === 'cancelled' ? 'Purchase cancelled.' : (res && res.message) || 'The payment did not go through. You were not charged.' };
      if (!(await PAYMENTS.provider.verify(res.receipt, product, ctx))) return { ok:false, message:'We could not confirm this payment. Contact support with your receipt.' };
      grantEntitlement(sku, res.receipt, PAYMENTS.provider.name);
      return { ok:true, message:`${product.name} unlocked. Thank you!` };
    } catch (e) {
      return { ok:false, message:'The store could not be reached. Check your connection and try again.' };
    }
  },
  async restore() {
    if (PAYMENTS.mode !== 'live' || !PAYMENTS.provider) { applyEntitlements(); save(); return { ok:true, message:'Purchases checked. Nothing new to restore.' }; }
    try {
      const list = await PAYMENTS.provider.restore({ playerId: S.playerId });
      let n = 0;
      for (const r of list || []) {
        const product = productBySku(r.sku);
        if (product && !ownsSku(r.sku) && await PAYMENTS.provider.verify(r.receipt, product, { playerId: S.playerId })) { grantEntitlement(r.sku, r.receipt, PAYMENTS.provider.name); n++; }
      }
      return { ok:true, message: n ? `Restored ${n} purchase${n > 1 ? 's' : ''}.` : 'Nothing new to restore.' };
    } catch (e) {
      return { ok:false, message:'The store could not be reached. Try again later.' };
    }
  }
};
