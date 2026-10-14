import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictWaitCycleEngine } from "./strict-wait-cycle-engine.js";
import { newStrictWaitCycle } from "./strict-wait-cycle.js";

test("StrictWaitCycleEngine keeps results within bounds", () => {
  const engine = defaultStrictWaitCycleEngine(flags.newRegistry());
  const item = newStrictWaitCycle("code-186", "label-528");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
