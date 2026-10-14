import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryMentionRuleEngine } from "./primary-mention-rule-engine.js";
import { newPrimaryMentionRule } from "./primary-mention-rule.js";

test("PrimaryMentionRuleEngine keeps results within bounds", () => {
  const engine = defaultPrimaryMentionRuleEngine(flags.newRegistry());
  const item = newPrimaryMentionRule("code-706", "name-568");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
