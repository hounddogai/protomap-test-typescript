import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledSlaRuleEngine } from "./scheduled-sla-rule-engine.js";
import { newScheduledSlaRule } from "./scheduled-sla-rule.js";

test("ScheduledSlaRuleEngine keeps results within bounds", () => {
  const engine = defaultScheduledSlaRuleEngine(flags.newRegistry());
  const item = newScheduledSlaRule("code-718", "title-388");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
