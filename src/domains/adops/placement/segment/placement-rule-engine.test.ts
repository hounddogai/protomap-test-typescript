import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementRuleEngine } from "./placement-rule-engine.js";
import { newPlacementRule } from "./placement-rule.js";

test("PlacementRuleEngine keeps results within bounds", () => {
  const engine = defaultPlacementRuleEngine(flags.newRegistry());
  const item = newPlacementRule("code-137", "label-367");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
