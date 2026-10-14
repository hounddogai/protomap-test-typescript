import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyThresholdEngine } from "./journey-threshold-engine.js";
import { newJourneyThreshold } from "./journey-threshold.js";

test("JourneyThresholdEngine keeps results within bounds", () => {
  const engine = defaultJourneyThresholdEngine();
  const item = newJourneyThreshold("code-104", "label-764");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
