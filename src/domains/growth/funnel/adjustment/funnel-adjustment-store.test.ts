import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelAdjustmentStore } from "./funnel-adjustment-store.js";
import { newFunnelAdjustment } from "./funnel-adjustment.js";

test("MemoryFunnelAdjustmentStore finds what it saved", () => {
  const store = newMemoryFunnelAdjustmentStore();
  const item = newFunnelAdjustment("code-536", "name-476");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
