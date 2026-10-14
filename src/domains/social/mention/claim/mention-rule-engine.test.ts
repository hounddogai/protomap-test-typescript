import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionRuleEngine } from "./mention-rule-engine.js";
import { newMentionRule } from "./mention-rule.js";

test("MentionRuleEngine keeps results within bounds", () => {
  const engine = defaultMentionRuleEngine(flags.newRegistry());
  const item = newMentionRule("code-985", "title-696");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
