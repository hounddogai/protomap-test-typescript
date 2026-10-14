import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionScoreStore } from "./mention-score-store.js";
import { newMentionScore } from "./mention-score.js";

test("MemoryMentionScoreStore finds what it saved", () => {
  const store = newMemoryMentionScoreStore();
  const item = newMentionScore("code-511", "label-623");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
