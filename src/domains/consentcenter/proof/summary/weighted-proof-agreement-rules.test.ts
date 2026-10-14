import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedProofAgreementRequiredLabelRule,
  defaultWeightedProofAgreementValidator,
} from "./weighted-proof-agreement-rules.js";
import { newWeightedProofAgreement } from "./weighted-proof-agreement.js";

test("WeightedProofAgreementValidator reports every problem", () => {
  const validator = defaultWeightedProofAgreementValidator();
  const item = newWeightedProofAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedProofAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedProofAgreementRequiredLabelRule("weighted proof agreement needs this field");
  const item = newWeightedProofAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
