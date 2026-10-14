import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedProofAgreementEngine } from "./weighted-proof-agreement-engine.js";
import { newWeightedProofAgreement } from "./weighted-proof-agreement.js";

test("WeightedProofAgreementEngine keeps results within bounds", () => {
  const engine = defaultWeightedProofAgreementEngine(flags.newRegistry());
  const item = newWeightedProofAgreement("code-828", "label-866");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
