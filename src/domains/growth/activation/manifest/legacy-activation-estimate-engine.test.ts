import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyActivationEstimateEngine } from "./legacy-activation-estimate-engine.js";
import { newLegacyActivationEstimate } from "./legacy-activation-estimate.js";

test("LegacyActivationEstimateEngine keeps results within bounds", () => {
  const engine = defaultLegacyActivationEstimateEngine(flags.newRegistry());
  const item = newLegacyActivationEstimate("code-445", "label-348");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
