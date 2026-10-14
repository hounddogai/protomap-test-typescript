import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPacingAgreementEngine } from "./pacing-agreement-engine.js";
import { newPacingAgreement } from "./pacing-agreement.js";

test("PacingAgreementEngine keeps results within bounds", () => {
  const engine = defaultPacingAgreementEngine();
  const item = newPacingAgreement("code-72", "label-164");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
