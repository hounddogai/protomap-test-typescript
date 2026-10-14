import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeScoreStore } from "./challenge-score-store.js";
import { newChallengeScore } from "./challenge-score.js";

test("MemoryChallengeScoreStore finds what it saved", () => {
  const store = newMemoryChallengeScoreStore();
  const item = newChallengeScore("code-301", "name-21");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
