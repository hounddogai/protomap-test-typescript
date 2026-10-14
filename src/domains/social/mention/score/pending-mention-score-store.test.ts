import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingMentionScoreStore } from "./pending-mention-score-store.js";
import { newPendingMentionScore } from "./pending-mention-score.js";

test("MemoryPendingMentionScoreStore finds what it saved", () => {
  const store = newMemoryPendingMentionScoreStore();
  const item = newPendingMentionScore("code-864", "title-954");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
