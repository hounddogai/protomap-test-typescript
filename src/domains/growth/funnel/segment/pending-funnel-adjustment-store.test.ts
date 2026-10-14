import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingFunnelAdjustmentStore } from "./pending-funnel-adjustment-store.js";
import { newPendingFunnelAdjustment } from "./pending-funnel-adjustment.js";

test("MemoryPendingFunnelAdjustmentStore finds what it saved", () => {
  const store = newMemoryPendingFunnelAdjustmentStore();
  const item = newPendingFunnelAdjustment("code-78", "title-86");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
