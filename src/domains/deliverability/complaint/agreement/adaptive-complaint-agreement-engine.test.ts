import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveComplaintAgreementEngine } from "./adaptive-complaint-agreement-engine.js";
import { newAdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

test("AdaptiveComplaintAgreementEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveComplaintAgreementEngine();
  const item = newAdaptiveComplaintAgreement("code-679", "label-724");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
