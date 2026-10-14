import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingPaywallAgreementEngine } from "./rolling-paywall-agreement-engine.js";
import { newRollingPaywallAgreement } from "./rolling-paywall-agreement.js";

test("RollingPaywallAgreementEngine keeps results within bounds", () => {
  const engine = defaultRollingPaywallAgreementEngine();
  const item = newRollingPaywallAgreement("code-974", "label-668");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
