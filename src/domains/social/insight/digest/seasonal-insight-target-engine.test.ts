import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalInsightTargetEngine } from "./seasonal-insight-target-engine.js";
import { newSeasonalInsightTarget } from "./seasonal-insight-target.js";

test("SeasonalInsightTargetEngine keeps results within bounds", () => {
  const engine = defaultSeasonalInsightTargetEngine();
  const item = newSeasonalInsightTarget("code-12", "label-201");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
