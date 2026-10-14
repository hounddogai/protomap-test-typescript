import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveApprovalAgreementEngine } from "./adaptive-approval-agreement-engine.js";
import { newAdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

test("AdaptiveApprovalAgreementEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveApprovalAgreementEngine();
  const item = newAdaptiveApprovalAgreement("code-508", "label-683");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
