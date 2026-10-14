import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryPacingVarianceEngine } from "./primary-pacing-variance-engine.js";
import { newPrimaryPacingVariance } from "./primary-pacing-variance.js";

test("PrimaryPacingVarianceEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPacingVarianceEngine(flags.newRegistry());
  const item = newPrimaryPacingVariance("code-401", "name-160");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
