import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalExitRuleAllocationEngine } from "./global-exit-rule-allocation-engine.js";
import { newGlobalExitRuleAllocation } from "./global-exit-rule-allocation.js";

test("GlobalExitRuleAllocationEngine keeps results within bounds", () => {
  const engine = defaultGlobalExitRuleAllocationEngine(flags.newRegistry());
  const item = newGlobalExitRuleAllocation("code-892", "label-9");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
