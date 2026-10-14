import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictBidRuleVarianceEngine } from "./strict-bid-rule-variance-engine.js";
import { newStrictBidRuleVariance } from "./strict-bid-rule-variance.js";

test("StrictBidRuleVarianceEngine keeps results within bounds", () => {
  const engine = defaultStrictBidRuleVarianceEngine(flags.newRegistry());
  const item = newStrictBidRuleVariance("code-310", "label-93");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
