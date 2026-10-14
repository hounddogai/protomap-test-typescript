import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakAdjustmentStore } from "./streak-adjustment-store.js";
import { newStreakAdjustment } from "./streak-adjustment.js";

test("MemoryStreakAdjustmentStore finds what it saved", () => {
  const store = newMemoryStreakAdjustmentStore();
  const item = newStreakAdjustment("code-598", "name-54");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
