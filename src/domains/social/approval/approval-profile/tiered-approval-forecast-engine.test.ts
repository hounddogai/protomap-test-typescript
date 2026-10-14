import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredApprovalForecastEngine } from "./tiered-approval-forecast-engine.js";
import { newTieredApprovalForecast } from "./tiered-approval-forecast.js";

test("TieredApprovalForecastEngine keeps results within bounds", () => {
  const engine = defaultTieredApprovalForecastEngine(flags.newRegistry());
  const item = newTieredApprovalForecast("code-906", "label-430");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
