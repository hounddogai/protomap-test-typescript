import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortThresholdEngine } from "./cohort-threshold-engine.js";
import { newCohortThreshold } from "./cohort-threshold.js";

test("CohortThresholdEngine keeps results within bounds", () => {
  const engine = defaultCohortThresholdEngine();
  const item = newCohortThreshold("code-199", "label-4");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
