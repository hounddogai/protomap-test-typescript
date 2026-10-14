import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedOptOutAgreementEngine } from "./weighted-opt-out-agreement-engine.js";
import { newWeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

test("WeightedOptOutAgreementEngine keeps results within bounds", () => {
  const engine = defaultWeightedOptOutAgreementEngine(flags.newRegistry());
  const item = newWeightedOptOutAgreement("code-611", "title-343");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
