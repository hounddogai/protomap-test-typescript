import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationMetricEngine } from "./activation-metric-engine.js";
import { newActivationMetric } from "./activation-metric.js";

test("ActivationMetricEngine keeps results within bounds", () => {
  const engine = defaultActivationMetricEngine(flags.newRegistry());
  const item = newActivationMetric("code-693", "name-91");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
