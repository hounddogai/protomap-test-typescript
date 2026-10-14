import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredEnrollmentAgreementEngine } from "./tiered-enrollment-agreement-engine.js";
import { newTieredEnrollmentAgreement } from "./tiered-enrollment-agreement.js";

test("TieredEnrollmentAgreementEngine keeps results within bounds", () => {
  const engine = defaultTieredEnrollmentAgreementEngine(flags.newRegistry());
  const item = newTieredEnrollmentAgreement("code-649", "label-500");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
