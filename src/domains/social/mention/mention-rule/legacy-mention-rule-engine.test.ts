import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyMentionRuleEngine } from "./legacy-mention-rule-engine.js";
import { newLegacyMentionRule } from "./legacy-mention-rule.js";

test("LegacyMentionRuleEngine keeps results within bounds", () => {
  const engine = defaultLegacyMentionRuleEngine(flags.newRegistry());
  const item = newLegacyMentionRule("code-920", "title-22");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
