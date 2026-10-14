import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRetentionScoreStore } from "./tiered-retention-score-store.js";
import { newTieredRetentionScore } from "./tiered-retention-score.js";

test("MemoryTieredRetentionScoreStore finds what it saved", () => {
  const store = newMemoryTieredRetentionScoreStore();
  const item = newTieredRetentionScore("code-110", "label-819");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
