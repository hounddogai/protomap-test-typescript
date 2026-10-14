import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualExitRuleBaselineEngine } from "./manual-exit-rule-baseline-engine.js";
import { newManualExitRuleBaseline } from "./manual-exit-rule-baseline.js";

test("ManualExitRuleBaselineEngine keeps results within bounds", () => {
  const engine = defaultManualExitRuleBaselineEngine(flags.newRegistry());
  const item = newManualExitRuleBaseline("code-471", "name-927");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
