import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryRewardRuleForecastEngine } from "./primary-reward-rule-forecast-engine.js";
import { newPrimaryRewardRuleForecast } from "./primary-reward-rule-forecast.js";

test("PrimaryRewardRuleForecastEngine keeps results within bounds", () => {
  const engine = defaultPrimaryRewardRuleForecastEngine(flags.newRegistry());
  const item = newPrimaryRewardRuleForecast("code-844", "label-501");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
