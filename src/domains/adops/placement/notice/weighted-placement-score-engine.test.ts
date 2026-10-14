import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedPlacementScoreEngine } from "./weighted-placement-score-engine.js";
import { newWeightedPlacementScore } from "./weighted-placement-score.js";

test("WeightedPlacementScoreEngine keeps results within bounds", () => {
  const engine = defaultWeightedPlacementScoreEngine();
  const item = newWeightedPlacementScore("code-422", "name-556");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
