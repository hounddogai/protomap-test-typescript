import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultExitRuleForecastEngine } from "./default-exit-rule-forecast-engine.js";
import { newDefaultExitRuleForecast } from "./default-exit-rule-forecast.js";

test("DefaultExitRuleForecastEngine keeps results within bounds", () => {
  const engine = defaultDefaultExitRuleForecastEngine(flags.newRegistry());
  const item = newDefaultExitRuleForecast("code-933", "title-62");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
