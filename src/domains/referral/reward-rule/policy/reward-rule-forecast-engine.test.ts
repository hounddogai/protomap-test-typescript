import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleForecastEngine } from "./reward-rule-forecast-engine.js";
import { newRewardRuleForecast } from "./reward-rule-forecast.js";

test("RewardRuleForecastEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleForecastEngine(flags.newRegistry());
  const item = newRewardRuleForecast("code-861", "label-453");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
