import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptivePaywallAgreementEngine } from "./adaptive-paywall-agreement-engine.js";
import { newAdaptivePaywallAgreement } from "./adaptive-paywall-agreement.js";

test("AdaptivePaywallAgreementEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePaywallAgreementEngine(flags.newRegistry());
  const item = newAdaptivePaywallAgreement("code-572", "title-330");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
