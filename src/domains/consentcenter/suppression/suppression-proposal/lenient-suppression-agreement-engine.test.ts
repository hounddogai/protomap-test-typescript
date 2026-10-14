import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientSuppressionAgreementEngine } from "./lenient-suppression-agreement-engine.js";
import { newLenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

test("LenientSuppressionAgreementEngine keeps results within bounds", () => {
  const engine = defaultLenientSuppressionAgreementEngine(flags.newRegistry());
  const item = newLenientSuppressionAgreement("code-564", "label-370");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
