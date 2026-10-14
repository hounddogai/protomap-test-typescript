import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultPacingAgreementEngine } from "./default-pacing-agreement-engine.js";
import { newDefaultPacingAgreement } from "./default-pacing-agreement.js";

test("DefaultPacingAgreementEngine keeps results within bounds", () => {
  const engine = defaultDefaultPacingAgreementEngine();
  const item = newDefaultPacingAgreement("code-26", "label-201");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
