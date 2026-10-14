import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackPayoutAgreementEngine } from "./fallback-payout-agreement-engine.js";
import { newFallbackPayoutAgreement } from "./fallback-payout-agreement.js";

test("FallbackPayoutAgreementEngine keeps results within bounds", () => {
  const engine = defaultFallbackPayoutAgreementEngine(flags.newRegistry());
  const item = newFallbackPayoutAgreement("code-865", "label-953");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
