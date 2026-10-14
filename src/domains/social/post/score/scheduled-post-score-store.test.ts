import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPostScoreStore } from "./scheduled-post-score-store.js";
import { newScheduledPostScore } from "./scheduled-post-score.js";

test("MemoryScheduledPostScoreStore finds what it saved", () => {
  const store = newMemoryScheduledPostScoreStore();
  const item = newScheduledPostScore("code-320", "title-815");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
