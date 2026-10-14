import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupRuleEngine } from "./warmup-rule-engine.js";
import { newWarmupRule } from "./warmup-rule.js";

test("WarmupRuleEngine keeps results within bounds", () => {
  const engine = defaultWarmupRuleEngine(flags.newRegistry());
  const item = newWarmupRule("code-934", "title-13");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
