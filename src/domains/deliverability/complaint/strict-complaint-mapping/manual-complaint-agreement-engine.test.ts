import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualComplaintAgreementEngine } from "./manual-complaint-agreement-engine.js";
import { newManualComplaintAgreement } from "./manual-complaint-agreement.js";

test("ManualComplaintAgreementEngine keeps results within bounds", () => {
  const engine = defaultManualComplaintAgreementEngine(flags.newRegistry());
  const item = newManualComplaintAgreement("code-148", "title-704");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
