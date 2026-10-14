import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyMetricEngine } from "./journey-metric-engine.js";
import { newJourneyMetric } from "./journey-metric.js";

test("JourneyMetricEngine keeps results within bounds", () => {
  const engine = defaultJourneyMetricEngine(flags.newRegistry());
  const item = newJourneyMetric("code-166", "name-151");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
