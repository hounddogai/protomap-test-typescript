import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualFraudCheckAgreementEngine } from "./manual-fraud-check-agreement-engine.js";
import { newManualFraudCheckAgreement } from "./manual-fraud-check-agreement.js";

test("ManualFraudCheckAgreementEngine keeps results within bounds", () => {
  const engine = defaultManualFraudCheckAgreementEngine(flags.newRegistry());
  const item = newManualFraudCheckAgreement("code-606", "label-451");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
