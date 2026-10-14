import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedSenderRollupStore } from "./batched-sender-rollup-store.js";
import { newBatchedSenderRollup } from "./batched-sender-rollup.js";

test("MemoryBatchedSenderRollupStore finds what it saved", () => {
  const store = newMemoryBatchedSenderRollupStore();
  const item = newBatchedSenderRollup("code-667", "label-530");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
