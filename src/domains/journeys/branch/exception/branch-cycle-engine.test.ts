import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchCycleEngine } from "./branch-cycle-engine.js";
import { newBranchCycle } from "./branch-cycle.js";

test("BranchCycleEngine keeps results within bounds", () => {
  const engine = defaultBranchCycleEngine(flags.newRegistry());
  const item = newBranchCycle("code-624", "title-324");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
