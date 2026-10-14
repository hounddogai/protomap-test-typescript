import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleAgreementEngine } from "./bid-rule-agreement-engine.js";
import { newBidRuleAgreement } from "./bid-rule-agreement.js";

test("BidRuleAgreementEngine keeps results within bounds", () => {
  const engine = defaultBidRuleAgreementEngine();
  const item = newBidRuleAgreement("code-689", "label-737");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
