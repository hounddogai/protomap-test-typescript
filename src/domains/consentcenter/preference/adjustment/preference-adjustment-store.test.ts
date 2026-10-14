import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceAdjustmentStore } from "./preference-adjustment-store.js";
import { newPreferenceAdjustment } from "./preference-adjustment.js";

test("MemoryPreferenceAdjustmentStore finds what it saved", () => {
  const store = newMemoryPreferenceAdjustmentStore();
  const item = newPreferenceAdjustment("code-629", "title-690");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
