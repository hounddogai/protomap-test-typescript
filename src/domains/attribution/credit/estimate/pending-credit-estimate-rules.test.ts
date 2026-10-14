import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCreditEstimateLabelLengthRule,
  defaultPendingCreditEstimateValidator,
} from "./pending-credit-estimate-rules.js";
import { newPendingCreditEstimate } from "./pending-credit-estimate.js";

test("PendingCreditEstimateValidator reports every problem", () => {
  const validator = defaultPendingCreditEstimateValidator();
  const item = newPendingCreditEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCreditEstimateLabelLengthRule flags a long label", () => {
  const rule = new PendingCreditEstimateLabelLengthRule(1000);
  const item = newPendingCreditEstimate("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
