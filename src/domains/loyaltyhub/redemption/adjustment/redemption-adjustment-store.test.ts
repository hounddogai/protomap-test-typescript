import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionAdjustmentStore } from "./redemption-adjustment-store.js";
import { newRedemptionAdjustment } from "./redemption-adjustment.js";

test("MemoryRedemptionAdjustmentStore finds what it saved", () => {
  const store = newMemoryRedemptionAdjustmentStore();
  const item = newRedemptionAdjustment("code-819", "name-22");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
