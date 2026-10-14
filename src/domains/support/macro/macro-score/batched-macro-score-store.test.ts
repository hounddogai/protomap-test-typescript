import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedMacroScoreStore } from "./batched-macro-score-store.js";
import { newBatchedMacroScore } from "./batched-macro-score.js";

test("MemoryBatchedMacroScoreStore finds what it saved", () => {
  const store = newMemoryBatchedMacroScoreStore();
  const item = newBatchedMacroScore("code-702", "name-673");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
