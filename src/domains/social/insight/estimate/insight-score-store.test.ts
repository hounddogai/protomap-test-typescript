import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightScoreStore } from "./insight-score-store.js";
import { newInsightScore } from "./insight-score.js";

test("MemoryInsightScoreStore finds what it saved", () => {
  const store = newMemoryInsightScoreStore();
  const item = newInsightScore("code-299", "title-480");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
