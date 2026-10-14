import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictBidRuleAgreementEngine } from "./strict-bid-rule-agreement-engine.js";
import { newStrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

test("StrictBidRuleAgreementEngine keeps results within bounds", () => {
  const engine = defaultStrictBidRuleAgreementEngine(flags.newRegistry());
  const item = newStrictBidRuleAgreement("code-960", "label-476");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
