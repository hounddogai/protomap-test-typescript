import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueueForecastEngine } from "./queue-forecast-engine.js";
import { newQueueForecast } from "./queue-forecast.js";

test("QueueForecastEngine keeps results within bounds", () => {
  const engine = defaultQueueForecastEngine(flags.newRegistry());
  const item = newQueueForecast("code-476", "name-64");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
