import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueAdjustmentStore } from "./queue-adjustment-store.js";
import { newQueueAdjustment } from "./queue-adjustment.js";

test("MemoryQueueAdjustmentStore finds what it saved", () => {
  const store = newMemoryQueueAdjustmentStore();
  const item = newQueueAdjustment("code-91", "name-794");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
