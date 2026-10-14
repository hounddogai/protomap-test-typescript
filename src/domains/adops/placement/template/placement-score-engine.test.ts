import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementScoreEngine } from "./placement-score-engine.js";
import { newPlacementScore } from "./placement-score.js";

test("PlacementScoreEngine keeps results within bounds", () => {
  const engine = defaultPlacementScoreEngine();
  const item = newPlacementScore("code-761", "name-77");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
