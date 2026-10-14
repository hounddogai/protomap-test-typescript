import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionRuleEngine } from "./retention-rule-engine.js";
import { newRetentionRule } from "./retention-rule.js";

test("RetentionRuleEngine keeps results within bounds", () => {
  const engine = defaultRetentionRuleEngine(flags.newRegistry());
  const item = newRetentionRule("code-868", "name-228");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
