import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredRewardRuleForecastEngine } from "./tiered-reward-rule-forecast-engine.js";
import { newTieredRewardRuleForecast } from "./tiered-reward-rule-forecast.js";

test("TieredRewardRuleForecastEngine keeps results within bounds", () => {
  const engine = defaultTieredRewardRuleForecastEngine(flags.newRegistry());
  const item = newTieredRewardRuleForecast("code-772", "title-560");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
