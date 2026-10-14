import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackReplyScoreStore } from "./fallback-reply-score-store.js";
import { newFallbackReplyScore } from "./fallback-reply-score.js";

test("MemoryFallbackReplyScoreStore finds what it saved", () => {
  const store = newMemoryFallbackReplyScoreStore();
  const item = newFallbackReplyScore("code-301", "title-793");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
