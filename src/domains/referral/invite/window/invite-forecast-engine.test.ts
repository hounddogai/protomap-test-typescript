import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteForecastEngine } from "./invite-forecast-engine.js";
import { newInviteForecast } from "./invite-forecast.js";

test("InviteForecastEngine keeps results within bounds", () => {
  const engine = defaultInviteForecastEngine();
  const item = newInviteForecast("code-64", "title-428");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
