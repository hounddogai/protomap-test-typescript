import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostScoreStore } from "./post-score-store.js";
import { newPostScore } from "./post-score.js";

test("MemoryPostScoreStore finds what it saved", () => {
  const store = newMemoryPostScoreStore();
  const item = newPostScore("code-939", "title-968");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
