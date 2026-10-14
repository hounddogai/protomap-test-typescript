import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionScoreStore } from "./suppression-score-store.js";
import { newSuppressionScore } from "./suppression-score.js";

test("MemorySuppressionScoreStore finds what it saved", () => {
  const store = newMemorySuppressionScoreStore();
  const item = newSuppressionScore("code-985", "label-637");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
