import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackPostRuleEngine } from "./fallback-post-rule-engine.js";
import { newFallbackPostRule } from "./fallback-post-rule.js";

test("FallbackPostRuleEngine keeps results within bounds", () => {
  const engine = defaultFallbackPostRuleEngine(flags.newRegistry());
  const item = newFallbackPostRule("code-318", "label-415");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
