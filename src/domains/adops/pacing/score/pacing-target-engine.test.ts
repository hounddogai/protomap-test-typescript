import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingTargetEngine } from "./pacing-target-engine.js";
import { newPacingTarget } from "./pacing-target.js";

test("PacingTargetEngine keeps results within bounds", () => {
  const engine = defaultPacingTargetEngine(flags.newRegistry());
  const item = newPacingTarget("code-440", "title-810");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
