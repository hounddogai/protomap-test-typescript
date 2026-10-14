import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPostScoreStore } from "./default-post-score-store.js";
import { newDefaultPostScore } from "./default-post-score.js";

test("MemoryDefaultPostScoreStore finds what it saved", () => {
  const store = newMemoryDefaultPostScoreStore();
  const item = newDefaultPostScore("code-962", "name-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
