import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedCsatRuleEngine } from "./weighted-csat-rule-engine.js";
import { newWeightedCsatRule } from "./weighted-csat-rule.js";

test("WeightedCsatRuleEngine keeps results within bounds", () => {
  const engine = defaultWeightedCsatRuleEngine(flags.newRegistry());
  const item = newWeightedCsatRule("code-88", "name-670");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
