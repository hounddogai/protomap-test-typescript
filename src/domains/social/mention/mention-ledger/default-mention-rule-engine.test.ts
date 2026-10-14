import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultMentionRuleEngine } from "./default-mention-rule-engine.js";
import { newDefaultMentionRule } from "./default-mention-rule.js";

test("DefaultMentionRuleEngine keeps results within bounds", () => {
  const engine = defaultDefaultMentionRuleEngine();
  const item = newDefaultMentionRule("code-746", "label-323");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
