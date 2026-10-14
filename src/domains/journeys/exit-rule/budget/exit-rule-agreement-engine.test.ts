import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleAgreementEngine } from "./exit-rule-agreement-engine.js";
import { newExitRuleAgreement } from "./exit-rule-agreement.js";

test("ExitRuleAgreementEngine keeps results within bounds", () => {
  const engine = defaultExitRuleAgreementEngine();
  const item = newExitRuleAgreement("code-34", "title-676");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
