import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingBidRuleVarianceEngine } from "./pending-bid-rule-variance-engine.js";
import { newPendingBidRuleVariance } from "./pending-bid-rule-variance.js";

test("PendingBidRuleVarianceEngine keeps results within bounds", () => {
  const engine = defaultPendingBidRuleVarianceEngine(flags.newRegistry());
  const item = newPendingBidRuleVariance("code-121", "title-871");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
