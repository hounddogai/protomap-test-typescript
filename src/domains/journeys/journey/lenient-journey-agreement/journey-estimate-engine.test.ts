import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyEstimateEngine } from "./journey-estimate-engine.js";
import { newJourneyEstimate } from "./journey-estimate.js";

test("JourneyEstimateEngine keeps results within bounds", () => {
  const engine = defaultJourneyEstimateEngine();
  const item = newJourneyEstimate("code-55", "label-156");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
