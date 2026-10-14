import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedOptOutBaselineStore } from "./batched-opt-out-baseline-store.js";
import { newBatchedOptOutBaseline } from "./batched-opt-out-baseline.js";

test("MemoryBatchedOptOutBaselineStore finds what it saved", () => {
  const store = newMemoryBatchedOptOutBaselineStore();
  const item = newBatchedOptOutBaseline("code-73", "title-706");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
