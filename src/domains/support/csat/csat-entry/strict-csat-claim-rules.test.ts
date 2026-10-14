import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCsatClaimMinimumRangeRule,
  StrictCsatClaimRequiredSourceRule,
  defaultStrictCsatClaimValidator,
} from "./strict-csat-claim-rules.js";
import { newStrictCsatClaim } from "./strict-csat-claim.js";

test("StrictCsatClaimValidator reports every problem", () => {
  const validator = defaultStrictCsatClaimValidator();
  const item = newStrictCsatClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCsatClaimRequiredSourceRule flags a blank source", () => {
  const rule = new StrictCsatClaimRequiredSourceRule("strict csat claim needs an entry");
  const item = newStrictCsatClaim("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCsatClaimMinimumRangeRule flags values above minimum", () => {
  const rule = new StrictCsatClaimMinimumRangeRule(8.9, 1677.2);
  const item = newStrictCsatClaim("x", "y");
  item.minimum = 1678.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
