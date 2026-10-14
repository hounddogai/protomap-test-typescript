import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryQueueRollupStore } from "./primary-queue-rollup-store.js";
import { newPrimaryQueueRollup } from "./primary-queue-rollup.js";

test("MemoryPrimaryQueueRollupStore finds what it saved", () => {
  const store = newMemoryPrimaryQueueRollupStore();
  const item = newPrimaryQueueRollup("code-580", "title-442");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
