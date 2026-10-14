import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingWindowTargetEngine } from "./rolling-window-target-engine.js";
import { newRollingWindowTarget } from "./rolling-window-target.js";

test("RollingWindowTargetEngine keeps results within bounds", () => {
  const engine = defaultRollingWindowTargetEngine(flags.newRegistry());
  const item = newRollingWindowTarget("code-993", "title-807");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
