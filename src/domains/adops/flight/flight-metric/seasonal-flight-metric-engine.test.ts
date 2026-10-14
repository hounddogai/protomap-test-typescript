import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalFlightMetricEngine } from "./seasonal-flight-metric-engine.js";
import { newSeasonalFlightMetric } from "./seasonal-flight-metric.js";

test("SeasonalFlightMetricEngine keeps results within bounds", () => {
  const engine = defaultSeasonalFlightMetricEngine();
  const item = newSeasonalFlightMetric("code-99", "title-225");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
