import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalCreditAgreementEngine } from "./seasonal-credit-agreement-engine.js";
import { newSeasonalCreditAgreement } from "./seasonal-credit-agreement.js";

test("SeasonalCreditAgreementEngine keeps results within bounds", () => {
  const engine = defaultSeasonalCreditAgreementEngine(flags.newRegistry());
  const item = newSeasonalCreditAgreement("code-832", "name-817");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
