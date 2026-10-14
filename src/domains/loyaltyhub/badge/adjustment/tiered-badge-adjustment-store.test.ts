import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBadgeAdjustmentStore } from "./tiered-badge-adjustment-store.js";
import { newTieredBadgeAdjustment } from "./tiered-badge-adjustment.js";

test("MemoryTieredBadgeAdjustmentStore finds what it saved", () => {
  const store = newMemoryTieredBadgeAdjustmentStore();
  const item = newTieredBadgeAdjustment("code-356", "name-879");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
