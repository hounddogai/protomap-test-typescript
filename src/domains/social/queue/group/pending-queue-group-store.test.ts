import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingQueueGroupStore } from "./pending-queue-group-store.js";
import { newPendingQueueGroup } from "./pending-queue-group.js";

test("MemoryPendingQueueGroupStore finds what it saved", () => {
  const store = newMemoryPendingQueueGroupStore();
  const item = newPendingQueueGroup("code-280", "label-274");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
