import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingSlaAdjustmentStore } from "./pending-sla-adjustment-store.js";
import { newPendingSlaAdjustment } from "./pending-sla-adjustment.js";

test("MemoryPendingSlaAdjustmentStore finds what it saved", () => {
  const store = newMemoryPendingSlaAdjustmentStore();
  const item = newPendingSlaAdjustment("code-167", "name-370");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
