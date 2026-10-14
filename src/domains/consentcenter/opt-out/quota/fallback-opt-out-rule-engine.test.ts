import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackOptOutRuleEngine } from "./fallback-opt-out-rule-engine.js";
import { newFallbackOptOutRule } from "./fallback-opt-out-rule.js";

test("FallbackOptOutRuleEngine keeps results within bounds", () => {
  const engine = defaultFallbackOptOutRuleEngine(flags.newRegistry());
  const item = newFallbackOptOutRule("code-27", "label-897");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
