import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryExitRuleAgreementEngine } from "./primary-exit-rule-agreement-engine.js";
import { newPrimaryExitRuleAgreement } from "./primary-exit-rule-agreement.js";

test("PrimaryExitRuleAgreementEngine keeps results within bounds", () => {
  const engine = defaultPrimaryExitRuleAgreementEngine();
  const item = newPrimaryExitRuleAgreement("code-137", "label-569");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
