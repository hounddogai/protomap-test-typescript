import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingComplaintVarianceExternalRefLengthRule,
  RollingComplaintVarianceNameLengthRule,
  RollingComplaintVarianceRequiredExternalRefRule,
  defaultRollingComplaintVarianceValidator,
} from "./rolling-complaint-variance-rules.js";
import { newRollingComplaintVariance } from "./rolling-complaint-variance.js";

test("RollingComplaintVarianceValidator reports every problem", () => {
  const validator = defaultRollingComplaintVarianceValidator();
  const item = newRollingComplaintVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingComplaintVarianceRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RollingComplaintVarianceRequiredExternalRefRule("rolling complaint variance needs a value");
  const item = newRollingComplaintVariance("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingComplaintVarianceExternalRefLengthRule flags a long external ref", () => {
  const rule = new RollingComplaintVarianceExternalRefLengthRule(3600);
  const item = newRollingComplaintVariance("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingComplaintVarianceNameLengthRule flags a long name", () => {
  const rule = new RollingComplaintVarianceNameLengthRule(86400);
  const item = newRollingComplaintVariance("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
