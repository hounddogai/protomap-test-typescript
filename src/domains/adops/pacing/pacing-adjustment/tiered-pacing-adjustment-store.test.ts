import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPacingAdjustmentStore } from "./tiered-pacing-adjustment-store.js";
import { newTieredPacingAdjustment } from "./tiered-pacing-adjustment.js";

test("MemoryTieredPacingAdjustmentStore finds what it saved", () => {
  const store = newMemoryTieredPacingAdjustmentStore();
  const item = newTieredPacingAdjustment("code-927", "label-231");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
