import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingDomainMetricEngine } from "./rolling-domain-metric-engine.js";
import { newRollingDomainMetric } from "./rolling-domain-metric.js";

test("RollingDomainMetricEngine keeps results within bounds", () => {
  const engine = defaultRollingDomainMetricEngine(flags.newRegistry());
  const item = newRollingDomainMetric("code-97", "name-356");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
