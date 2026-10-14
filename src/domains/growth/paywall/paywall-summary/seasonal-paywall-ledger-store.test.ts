import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPaywallLedgerStore } from "./seasonal-paywall-ledger-store.js";
import { newSeasonalPaywallLedger } from "./seasonal-paywall-ledger.js";

test("MemorySeasonalPaywallLedgerStore finds what it saved", () => {
  const store = newMemorySeasonalPaywallLedgerStore();
  const item = newSeasonalPaywallLedger("code-427", "title-111");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
