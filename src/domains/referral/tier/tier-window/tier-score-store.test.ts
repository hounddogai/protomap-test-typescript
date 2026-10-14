import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierScoreStore } from "./tier-score-store.js";
import { newTierScore } from "./tier-score.js";

test("MemoryTierScoreStore finds what it saved", () => {
  const store = newMemoryTierScoreStore();
  const item = newTierScore("code-609", "name-902");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
