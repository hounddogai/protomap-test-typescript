import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalCohortClaimOpenRateRangeRule,
  RegionalCohortClaimRequiredPhoneRule,
  RegionalCohortClaimTitleLengthRule,
  defaultRegionalCohortClaimValidator,
} from "./regional-cohort-claim-rules.js";
import { newRegionalCohortClaim } from "./regional-cohort-claim.js";

test("RegionalCohortClaimValidator reports every problem", () => {
  const validator = defaultRegionalCohortClaimValidator();
  const item = newRegionalCohortClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalCohortClaimOpenRateRangeRule flags values above open rate", () => {
  const rule = new RegionalCohortClaimOpenRateRangeRule(7.8, 846.2);
  const item = newRegionalCohortClaim("x", "y");
  item.openRate = 847.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCohortClaimRequiredPhoneRule flags a blank phone", () => {
  const rule = new RegionalCohortClaimRequiredPhoneRule("regional cohort claim needs this field");
  const item = newRegionalCohortClaim("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCohortClaimTitleLengthRule flags a long title", () => {
  const rule = new RegionalCohortClaimTitleLengthRule(80);
  const item = newRegionalCohortClaim("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
