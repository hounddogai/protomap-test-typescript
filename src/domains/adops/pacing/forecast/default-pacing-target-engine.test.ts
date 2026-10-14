import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPacingTargetEngine } from "./default-pacing-target-engine.js";
import { newDefaultPacingTarget } from "./default-pacing-target.js";

test("DefaultPacingTargetEngine keeps results within bounds", () => {
  const engine = defaultDefaultPacingTargetEngine(flags.newRegistry());
  const item = newDefaultPacingTarget("code-577", "label-948");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
