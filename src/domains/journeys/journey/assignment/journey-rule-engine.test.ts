import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyRuleEngine } from "./journey-rule-engine.js";
import { newJourneyRule } from "./journey-rule.js";

test("JourneyRuleEngine keeps results within bounds", () => {
  const engine = defaultJourneyRuleEngine(flags.newRegistry());
  const item = newJourneyRule("code-962", "label-669");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
