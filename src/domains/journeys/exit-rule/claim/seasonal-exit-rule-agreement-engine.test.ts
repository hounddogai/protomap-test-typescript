import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalExitRuleAgreementEngine } from "./seasonal-exit-rule-agreement-engine.js";
import { newSeasonalExitRuleAgreement } from "./seasonal-exit-rule-agreement.js";

test("SeasonalExitRuleAgreementEngine keeps results within bounds", () => {
  const engine = defaultSeasonalExitRuleAgreementEngine(flags.newRegistry());
  const item = newSeasonalExitRuleAgreement("code-618", "title-971");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
