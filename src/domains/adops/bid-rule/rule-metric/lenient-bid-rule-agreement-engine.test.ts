import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientBidRuleAgreementEngine } from "./lenient-bid-rule-agreement-engine.js";
import { newLenientBidRuleAgreement } from "./lenient-bid-rule-agreement.js";

test("LenientBidRuleAgreementEngine keeps results within bounds", () => {
  const engine = defaultLenientBidRuleAgreementEngine(flags.newRegistry());
  const item = newLenientBidRuleAgreement("code-128", "name-288");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
