import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeScoreStore } from "./creative-score-store.js";
import { newCreativeScore } from "./creative-score.js";

test("MemoryCreativeScoreStore finds what it saved", () => {
  const store = newMemoryCreativeScoreStore();
  const item = newCreativeScore("code-644", "name-295");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
