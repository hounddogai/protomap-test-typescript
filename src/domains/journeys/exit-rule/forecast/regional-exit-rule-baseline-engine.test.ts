import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalExitRuleBaselineEngine } from "./regional-exit-rule-baseline-engine.js";
import { newRegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

test("RegionalExitRuleBaselineEngine keeps results within bounds", () => {
  const engine = defaultRegionalExitRuleBaselineEngine(flags.newRegistry());
  const item = newRegionalExitRuleBaseline("code-560", "name-152");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
