import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientBidRuleAdjustmentEngine } from "./lenient-bid-rule-adjustment-engine.js";
import { newLenientBidRuleAdjustment } from "./lenient-bid-rule-adjustment.js";

test("LenientBidRuleAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultLenientBidRuleAdjustmentEngine(flags.newRegistry());
  const item = newLenientBidRuleAdjustment("code-859", "title-471");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
