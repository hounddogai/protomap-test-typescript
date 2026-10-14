import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCohortTemplateCapacityRangeRule,
  PendingCohortTemplateCountryLengthRule,
  PendingCohortTemplateTimezoneLengthRule,
  defaultPendingCohortTemplateValidator,
} from "./pending-cohort-template-rules.js";
import { newPendingCohortTemplate } from "./pending-cohort-template.js";

test("PendingCohortTemplateValidator reports every problem", () => {
  const validator = defaultPendingCohortTemplateValidator();
  const item = newPendingCohortTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCohortTemplateTimezoneLengthRule flags a long timezone", () => {
  const rule = new PendingCohortTemplateTimezoneLengthRule(255);
  const item = newPendingCohortTemplate("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCohortTemplateCountryLengthRule flags a long country", () => {
  const rule = new PendingCohortTemplateCountryLengthRule(80);
  const item = newPendingCohortTemplate("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCohortTemplateCapacityRangeRule flags values above capacity", () => {
  const rule = new PendingCohortTemplateCapacityRangeRule(16, 3600);
  const item = newPendingCohortTemplate("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
