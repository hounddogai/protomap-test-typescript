import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementEstimateEngine } from "./placement-estimate-engine.js";
import { newPlacementEstimate } from "./placement-estimate.js";

test("PlacementEstimateEngine keeps results within bounds", () => {
  const engine = defaultPlacementEstimateEngine();
  const item = newPlacementEstimate("code-702", "label-955");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
