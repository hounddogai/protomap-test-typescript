import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFunnelAdjustmentStore } from "./weighted-funnel-adjustment-store.js";
import { newWeightedFunnelAdjustment } from "./weighted-funnel-adjustment.js";

test("MemoryWeightedFunnelAdjustmentStore finds what it saved", () => {
  const store = newMemoryWeightedFunnelAdjustmentStore();
  const item = newWeightedFunnelAdjustment("code-303", "label-903");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
