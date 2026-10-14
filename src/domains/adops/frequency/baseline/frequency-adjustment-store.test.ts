import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyAdjustmentStore } from "./frequency-adjustment-store.js";
import { newFrequencyAdjustment } from "./frequency-adjustment.js";

test("MemoryFrequencyAdjustmentStore finds what it saved", () => {
  const store = newMemoryFrequencyAdjustmentStore();
  const item = newFrequencyAdjustment("code-125", "name-117");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
