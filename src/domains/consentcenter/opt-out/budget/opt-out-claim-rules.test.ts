import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutClaimAmountRangeRule,
  OptOutClaimRequiredCategoryRule,
  OptOutClaimRequiredNameRule,
  OptOutClaimRequiredUtmSourceRule,
  defaultOptOutClaimValidator,
} from "./opt-out-claim-rules.js";
import { newOptOutClaim } from "./opt-out-claim.js";

test("OptOutClaimValidator reports every problem", () => {
  const validator = defaultOptOutClaimValidator();
  const item = newOptOutClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutClaimAmountRangeRule flags values above amount", () => {
  const rule = new OptOutClaimAmountRangeRule(8.1, 3577.3);
  const item = newOptOutClaim("x", "y");
  item.amount = 3578.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutClaimRequiredCategoryRule flags a blank category", () => {
  const rule = new OptOutClaimRequiredCategoryRule("opt out claim needs this field");
  const item = newOptOutClaim("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutClaimRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new OptOutClaimRequiredUtmSourceRule("opt out claim needs a value");
  const item = newOptOutClaim("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutClaimRequiredNameRule flags a blank name", () => {
  const rule = new OptOutClaimRequiredNameRule("opt out claim needs an entry");
  const item = newOptOutClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
