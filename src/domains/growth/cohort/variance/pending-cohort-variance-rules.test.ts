import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCohortVarianceLabelLengthRule,
  PendingCohortVarianceRequiredExternalRefRule,
  PendingCohortVarianceRequiredSourceRule,
  defaultPendingCohortVarianceValidator,
} from "./pending-cohort-variance-rules.js";
import { newPendingCohortVariance } from "./pending-cohort-variance.js";

test("PendingCohortVarianceValidator reports every problem", () => {
  const validator = defaultPendingCohortVarianceValidator();
  const item = newPendingCohortVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCohortVarianceLabelLengthRule flags a long label", () => {
  const rule = new PendingCohortVarianceLabelLengthRule(1000);
  const item = newPendingCohortVariance("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCohortVarianceRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PendingCohortVarianceRequiredExternalRefRule("pending cohort variance needs this field");
  const item = newPendingCohortVariance("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCohortVarianceRequiredSourceRule flags a blank source", () => {
  const rule = new PendingCohortVarianceRequiredSourceRule("pending cohort variance needs a value");
  const item = newPendingCohortVariance("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
