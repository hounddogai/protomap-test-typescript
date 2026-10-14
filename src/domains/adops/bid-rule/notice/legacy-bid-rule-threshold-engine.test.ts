import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyBidRuleThresholdEngine } from "./legacy-bid-rule-threshold-engine.js";
import { newLegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

test("LegacyBidRuleThresholdEngine keeps results within bounds", () => {
  const engine = defaultLegacyBidRuleThresholdEngine(flags.newRegistry());
  const item = newLegacyBidRuleThreshold("code-233", "label-384");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
