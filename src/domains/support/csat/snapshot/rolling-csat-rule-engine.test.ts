import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingCsatRuleEngine } from "./rolling-csat-rule-engine.js";
import { newRollingCsatRule } from "./rolling-csat-rule.js";

test("RollingCsatRuleEngine keeps results within bounds", () => {
  const engine = defaultRollingCsatRuleEngine(flags.newRegistry());
  const item = newRollingCsatRule("code-258", "name-721");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
