import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictExitRuleOverrideEngine } from "./strict-exit-rule-override-engine.js";
import { newStrictExitRuleOverride } from "./strict-exit-rule-override.js";

test("StrictExitRuleOverrideEngine keeps results within bounds", () => {
  const engine = defaultStrictExitRuleOverrideEngine(flags.newRegistry());
  const item = newStrictExitRuleOverride("code-970", "label-752");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
