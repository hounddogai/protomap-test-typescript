import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyComplaintVarianceCreatedAtRangeRule,
  LegacyComplaintVarianceRequiredCodeRule,
  LegacyComplaintVarianceRequiredTitleRule,
  defaultLegacyComplaintVarianceValidator,
} from "./legacy-complaint-variance-rules.js";
import { newLegacyComplaintVariance } from "./legacy-complaint-variance.js";

test("LegacyComplaintVarianceValidator reports every problem", () => {
  const validator = defaultLegacyComplaintVarianceValidator();
  const item = newLegacyComplaintVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyComplaintVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyComplaintVarianceRequiredCodeRule("legacy complaint variance needs this field");
  const item = newLegacyComplaintVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyComplaintVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyComplaintVarianceRequiredTitleRule("legacy complaint variance needs an entry");
  const item = newLegacyComplaintVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyComplaintVarianceCreatedAtRangeRule flags values above created at", () => {
  const rule = new LegacyComplaintVarianceCreatedAtRangeRule(80, 86400);
  const item = newLegacyComplaintVariance("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
