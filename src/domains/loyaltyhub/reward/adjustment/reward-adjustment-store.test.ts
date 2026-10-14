import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardAdjustmentStore } from "./reward-adjustment-store.js";
import { newRewardAdjustment } from "./reward-adjustment.js";

test("MemoryRewardAdjustmentStore finds what it saved", () => {
  const store = newMemoryRewardAdjustmentStore();
  const item = newRewardAdjustment("code-628", "name-844");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
