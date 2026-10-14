import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalWaitAdjustmentStore } from "./seasonal-wait-adjustment-store.js";
import { newSeasonalWaitAdjustment } from "./seasonal-wait-adjustment.js";

test("MemorySeasonalWaitAdjustmentStore finds what it saved", () => {
  const store = newMemorySeasonalWaitAdjustmentStore();
  const item = newSeasonalWaitAdjustment("code-134", "label-711");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
