import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyRuleEngine } from "./reply-rule-engine.js";
import { newReplyRule } from "./reply-rule.js";

test("ReplyRuleEngine keeps results within bounds", () => {
  const engine = defaultReplyRuleEngine(flags.newRegistry());
  const item = newReplyRule("code-526", "title-700");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
