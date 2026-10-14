import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualBadgeForecastEngine } from "./manual-badge-forecast-engine.js";
import { newManualBadgeForecast } from "./manual-badge-forecast.js";

test("ManualBadgeForecastEngine keeps results within bounds", () => {
  const engine = defaultManualBadgeForecastEngine(flags.newRegistry());
  const item = newManualBadgeForecast("code-92", "title-948");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
