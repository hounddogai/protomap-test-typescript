import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedChallengeBaselineStore } from "./batched-challenge-baseline-store.js";
import { newBatchedChallengeBaseline } from "./batched-challenge-baseline.js";

test("MemoryBatchedChallengeBaselineStore finds what it saved", () => {
  const store = newMemoryBatchedChallengeBaselineStore();
  const item = newBatchedChallengeBaseline("code-77", "label-543");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
