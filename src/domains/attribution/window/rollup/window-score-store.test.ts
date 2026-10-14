import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowScoreStore } from "./window-score-store.js";
import { newWindowScore } from "./window-score.js";

test("MemoryWindowScoreStore finds what it saved", () => {
  const store = newMemoryWindowScoreStore();
  const item = newWindowScore("code-209", "label-955");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
