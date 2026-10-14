import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictRedemptionAgreementEngine } from "./strict-redemption-agreement-engine.js";
import { newStrictRedemptionAgreement } from "./strict-redemption-agreement.js";

test("StrictRedemptionAgreementEngine keeps results within bounds", () => {
  const engine = defaultStrictRedemptionAgreementEngine();
  const item = newStrictRedemptionAgreement("code-473", "label-289");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
