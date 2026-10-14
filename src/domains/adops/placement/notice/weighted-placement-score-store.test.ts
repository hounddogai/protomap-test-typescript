import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPlacementScoreStore } from "./weighted-placement-score-store.js";
import { newWeightedPlacementScore } from "./weighted-placement-score.js";

test("MemoryWeightedPlacementScoreStore finds what it saved", () => {
  const store = newMemoryWeightedPlacementScoreStore();
  const item = newWeightedPlacementScore("code-422", "name-556");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
