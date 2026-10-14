import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedLevelAdjustmentStore } from "./capped-level-adjustment-store.js";
import { newCappedLevelAdjustment } from "./capped-level-adjustment.js";

test("MemoryCappedLevelAdjustmentStore finds what it saved", () => {
  const store = newMemoryCappedLevelAdjustmentStore();
  const item = newCappedLevelAdjustment("code-832", "name-541");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
