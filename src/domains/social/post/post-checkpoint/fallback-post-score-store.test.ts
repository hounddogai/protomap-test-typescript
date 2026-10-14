import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPostScoreStore } from "./fallback-post-score-store.js";
import { newFallbackPostScore } from "./fallback-post-score.js";

test("MemoryFallbackPostScoreStore finds what it saved", () => {
  const store = newMemoryFallbackPostScoreStore();
  const item = newFallbackPostScore("code-221", "title-810");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
