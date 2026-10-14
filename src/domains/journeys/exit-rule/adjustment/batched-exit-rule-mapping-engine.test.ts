import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedExitRuleMappingEngine } from "./batched-exit-rule-mapping-engine.js";
import { newBatchedExitRuleMapping } from "./batched-exit-rule-mapping.js";

test("BatchedExitRuleMappingEngine keeps results within bounds", () => {
  const engine = defaultBatchedExitRuleMappingEngine(flags.newRegistry());
  const item = newBatchedExitRuleMapping("code-523", "label-906");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
