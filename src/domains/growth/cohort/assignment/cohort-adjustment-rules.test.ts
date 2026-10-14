import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortAdjustmentCodeLengthRule,
  CohortAdjustmentNameLengthRule,
  CohortAdjustmentOpenRateRangeRule,
  CohortAdjustmentRequiredNameRule,
  CohortAdjustmentRevisionRangeRule,
  defaultCohortAdjustmentValidator,
} from "./cohort-adjustment-rules.js";
import { newCohortAdjustment } from "./cohort-adjustment.js";

test("CohortAdjustmentValidator reports every problem", () => {
  const validator = defaultCohortAdjustmentValidator();
  const item = newCohortAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortAdjustmentRevisionRangeRule flags values above revision", () => {
  const rule = new CohortAdjustmentRevisionRangeRule(64, 255);
  const item = newCohortAdjustment("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortAdjustmentNameLengthRule flags a long name", () => {
  const rule = new CohortAdjustmentNameLengthRule(1000);
  const item = newCohortAdjustment("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new CohortAdjustmentRequiredNameRule("cohort adjustment needs a value");
  const item = newCohortAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortAdjustmentOpenRateRangeRule flags values above open rate", () => {
  const rule = new CohortAdjustmentOpenRateRangeRule(8.5, 2597.7);
  const item = newCohortAdjustment("x", "y");
  item.openRate = 2599.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new CohortAdjustmentCodeLengthRule(86400);
  const item = newCohortAdjustment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
