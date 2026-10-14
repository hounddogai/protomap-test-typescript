import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedMacroScoreStore } from "./weighted-macro-score-store.js";
import { newWeightedMacroScore } from "./weighted-macro-score.js";

test("MemoryWeightedMacroScoreStore finds what it saved", () => {
  const store = newMemoryWeightedMacroScoreStore();
  const item = newWeightedMacroScore("code-752", "label-241");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
