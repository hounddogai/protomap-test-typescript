import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalPostMetricEngine } from "./seasonal-post-metric-engine.js";
import { newSeasonalPostMetric } from "./seasonal-post-metric.js";

test("SeasonalPostMetricEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPostMetricEngine(flags.newRegistry());
  const item = newSeasonalPostMetric("code-923", "label-473");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
