import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictPacingRollupEngine } from "./strict-pacing-rollup-engine.js";
import { newStrictPacingRollup } from "./strict-pacing-rollup.js";

test("StrictPacingRollupEngine keeps results within bounds", () => {
  const engine = defaultStrictPacingRollupEngine(flags.newRegistry());
  const item = newStrictPacingRollup("code-690", "title-585");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
