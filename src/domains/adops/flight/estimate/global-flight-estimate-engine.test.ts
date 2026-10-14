import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalFlightEstimateEngine } from "./global-flight-estimate-engine.js";
import { newGlobalFlightEstimate } from "./global-flight-estimate.js";

test("GlobalFlightEstimateEngine keeps results within bounds", () => {
  const engine = defaultGlobalFlightEstimateEngine(flags.newRegistry());
  const item = newGlobalFlightEstimate("code-703", "title-733");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
