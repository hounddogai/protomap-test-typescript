import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveBounceAdjustmentStore } from "./adaptive-bounce-adjustment-store.js";
import { newAdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

test("MemoryAdaptiveBounceAdjustmentStore finds what it saved", () => {
  const store = newMemoryAdaptiveBounceAdjustmentStore();
  const item = newAdaptiveBounceAdjustment("code-575", "label-713");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
