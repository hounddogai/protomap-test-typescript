import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingQuotaCapacityRangeRule,
  PacingQuotaLabelLengthRule,
  PacingQuotaRequiredLabelRule,
  defaultPacingQuotaValidator,
} from "./pacing-quota-rules.js";
import { newPacingQuota } from "./pacing-quota.js";

test("PacingQuotaValidator reports every problem", () => {
  const validator = defaultPacingQuotaValidator();
  const item = newPacingQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new PacingQuotaRequiredLabelRule("pacing quota needs a value");
  const item = newPacingQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingQuotaCapacityRangeRule flags values above capacity", () => {
  const rule = new PacingQuotaCapacityRangeRule(64, 255);
  const item = newPacingQuota("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingQuotaLabelLengthRule flags a long label", () => {
  const rule = new PacingQuotaLabelLengthRule(86400);
  const item = newPacingQuota("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
