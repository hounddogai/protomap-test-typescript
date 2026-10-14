import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallAdjustmentStore } from "./paywall-adjustment-store.js";
import { newPaywallAdjustment } from "./paywall-adjustment.js";

test("MemoryPaywallAdjustmentStore finds what it saved", () => {
  const store = newMemoryPaywallAdjustmentStore();
  const item = newPaywallAdjustment("code-652", "name-205");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
