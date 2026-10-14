import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathTargetEngine } from "./path-target-engine.js";
import { newPathTarget } from "./path-target.js";

test("PathTargetEngine keeps results within bounds", () => {
  const engine = defaultPathTargetEngine(flags.newRegistry());
  const item = newPathTarget("code-518", "name-892");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
