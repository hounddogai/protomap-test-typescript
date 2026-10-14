import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledRetentionScoreStore } from "./scheduled-retention-score-store.js";
import { newScheduledRetentionScore } from "./scheduled-retention-score.js";

test("MemoryScheduledRetentionScoreStore finds what it saved", () => {
  const store = newMemoryScheduledRetentionScoreStore();
  const item = newScheduledRetentionScore("code-182", "label-530");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
