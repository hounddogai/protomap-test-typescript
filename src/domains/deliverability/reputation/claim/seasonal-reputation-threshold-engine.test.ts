import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalReputationThresholdEngine } from "./seasonal-reputation-threshold-engine.js";
import { newSeasonalReputationThreshold } from "./seasonal-reputation-threshold.js";

test("SeasonalReputationThresholdEngine keeps results within bounds", () => {
  const engine = defaultSeasonalReputationThresholdEngine();
  const item = newSeasonalReputationThreshold("code-46", "label-850");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
