import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaForecastEngine } from "./sla-forecast-engine.js";
import { newSlaForecast } from "./sla-forecast.js";

test("SlaForecastEngine keeps results within bounds", () => {
  const engine = defaultSlaForecastEngine(flags.newRegistry());
  const item = newSlaForecast("code-188", "title-11");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
