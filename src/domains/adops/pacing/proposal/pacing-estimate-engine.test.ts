import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingEstimateEngine } from "./pacing-estimate-engine.js";
import { newPacingEstimate } from "./pacing-estimate.js";

test("PacingEstimateEngine keeps results within bounds", () => {
  const engine = defaultPacingEstimateEngine(flags.newRegistry());
  const item = newPacingEstimate("code-555", "name-370");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
