import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualCreditAgreementEngine } from "./manual-credit-agreement-engine.js";
import { newManualCreditAgreement } from "./manual-credit-agreement.js";

test("ManualCreditAgreementEngine keeps results within bounds", () => {
  const engine = defaultManualCreditAgreementEngine();
  const item = newManualCreditAgreement("code-82", "title-336");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
