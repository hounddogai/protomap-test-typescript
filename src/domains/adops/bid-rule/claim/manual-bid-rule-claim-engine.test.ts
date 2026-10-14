import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualBidRuleClaimEngine } from "./manual-bid-rule-claim-engine.js";
import { newManualBidRuleClaim } from "./manual-bid-rule-claim.js";

test("ManualBidRuleClaimEngine keeps results within bounds", () => {
  const engine = defaultManualBidRuleClaimEngine(flags.newRegistry());
  const item = newManualBidRuleClaim("code-755", "label-906");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
