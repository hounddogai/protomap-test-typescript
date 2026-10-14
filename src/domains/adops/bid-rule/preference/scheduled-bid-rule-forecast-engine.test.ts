import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledBidRuleForecastEngine } from "./scheduled-bid-rule-forecast-engine.js";
import { newScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

test("ScheduledBidRuleForecastEngine keeps results within bounds", () => {
  const engine = defaultScheduledBidRuleForecastEngine(flags.newRegistry());
  const item = newScheduledBidRuleForecast("code-901", "title-798");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
