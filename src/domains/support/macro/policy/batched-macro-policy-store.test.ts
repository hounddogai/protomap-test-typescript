import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedMacroPolicyStore } from "./batched-macro-policy-store.js";
import { newBatchedMacroPolicy } from "./batched-macro-policy.js";

test("MemoryBatchedMacroPolicyStore finds what it saved", () => {
  const store = newMemoryBatchedMacroPolicyStore();
  const item = newBatchedMacroPolicy("code-142", "label-522");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
