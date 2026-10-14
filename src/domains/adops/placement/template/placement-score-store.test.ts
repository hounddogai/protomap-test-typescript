import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementScoreStore } from "./placement-score-store.js";
import { newPlacementScore } from "./placement-score.js";

test("MemoryPlacementScoreStore finds what it saved", () => {
  const store = newMemoryPlacementScoreStore();
  const item = newPlacementScore("code-761", "name-77");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
