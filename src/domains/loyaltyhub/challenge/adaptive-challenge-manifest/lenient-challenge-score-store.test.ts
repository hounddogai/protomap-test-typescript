import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientChallengeScoreStore } from "./lenient-challenge-score-store.js";
import { newLenientChallengeScore } from "./lenient-challenge-score.js";

test("MemoryLenientChallengeScoreStore finds what it saved", () => {
  const store = newMemoryLenientChallengeScoreStore();
  const item = newLenientChallengeScore("code-899", "name-480");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
