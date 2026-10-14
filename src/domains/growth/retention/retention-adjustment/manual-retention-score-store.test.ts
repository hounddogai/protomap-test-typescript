import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualRetentionScoreStore } from "./manual-retention-score-store.js";
import { newManualRetentionScore } from "./manual-retention-score.js";

test("MemoryManualRetentionScoreStore finds what it saved", () => {
  const store = newMemoryManualRetentionScoreStore();
  const item = newManualRetentionScore("code-819", "name-173");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
