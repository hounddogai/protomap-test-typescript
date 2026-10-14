import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRewardScoreStore } from "./lenient-reward-score-store.js";
import { newLenientRewardScore } from "./lenient-reward-score.js";

test("MemoryLenientRewardScoreStore finds what it saved", () => {
  const store = newMemoryLenientRewardScoreStore();
  const item = newLenientRewardScore("code-128", "title-914");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
