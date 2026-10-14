import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupCycleEngine } from "./warmup-cycle-engine.js";
import { newWarmupCycle } from "./warmup-cycle.js";

test("WarmupCycleEngine keeps results within bounds", () => {
  const engine = defaultWarmupCycleEngine(flags.newRegistry());
  const item = newWarmupCycle("code-644", "label-695");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
