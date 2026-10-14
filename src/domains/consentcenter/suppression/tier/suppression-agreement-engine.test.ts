import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSuppressionAgreementEngine } from "./suppression-agreement-engine.js";
import { newSuppressionAgreement } from "./suppression-agreement.js";

test("SuppressionAgreementEngine keeps results within bounds", () => {
  const engine = defaultSuppressionAgreementEngine(flags.newRegistry());
  const item = newSuppressionAgreement("code-833", "name-378");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
