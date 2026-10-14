import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditAgreementEngine } from "./credit-agreement-engine.js";
import { newCreditAgreement } from "./credit-agreement.js";

test("CreditAgreementEngine keeps results within bounds", () => {
  const engine = defaultCreditAgreementEngine();
  const item = newCreditAgreement("code-329", "label-818");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
