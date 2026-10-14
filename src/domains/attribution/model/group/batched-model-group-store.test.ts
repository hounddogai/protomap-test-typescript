import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedModelGroupStore } from "./batched-model-group-store.js";
import { newBatchedModelGroup } from "./batched-model-group.js";

test("MemoryBatchedModelGroupStore finds what it saved", () => {
  const store = newMemoryBatchedModelGroupStore();
  const item = newBatchedModelGroup("code-78", "label-977");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
