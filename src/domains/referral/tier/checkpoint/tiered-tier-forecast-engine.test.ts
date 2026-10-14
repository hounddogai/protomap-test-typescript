import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredTierForecastEngine } from "./tiered-tier-forecast-engine.js";
import { newTieredTierForecast } from "./tiered-tier-forecast.js";

test("TieredTierForecastEngine keeps results within bounds", () => {
  const engine = defaultTieredTierForecastEngine(flags.newRegistry());
  const item = newTieredTierForecast("code-883", "name-974");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
