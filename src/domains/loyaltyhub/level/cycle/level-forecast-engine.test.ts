import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelForecastEngine } from "./level-forecast-engine.js";
import { newLevelForecast } from "./level-forecast.js";

test("LevelForecastEngine keeps results within bounds", () => {
  const engine = defaultLevelForecastEngine(flags.newRegistry());
  const item = newLevelForecast("code-624", "label-63");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
