import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewRuleEngine } from "./ticket-view-rule-engine.js";
import { newTicketViewRule } from "./ticket-view-rule.js";

test("TicketViewRuleEngine keeps results within bounds", () => {
  const engine = defaultTicketViewRuleEngine(flags.newRegistry());
  const item = newTicketViewRule("code-544", "label-16");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
