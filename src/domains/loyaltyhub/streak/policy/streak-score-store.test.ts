import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakScoreStore } from "./streak-score-store.js";
import { newStreakScore } from "./streak-score.js";

test("MemoryStreakScoreStore finds what it saved", () => {
  const store = newMemoryStreakScoreStore();
  const item = newStreakScore("code-361", "title-110");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
