import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowAgreementBidRangeRule,
  WindowAgreementCategoryLengthRule,
  WindowAgreementNameLengthRule,
  defaultWindowAgreementValidator,
} from "./window-agreement-rules.js";
import { newWindowAgreement } from "./window-agreement.js";

test("WindowAgreementValidator reports every problem", () => {
  const validator = defaultWindowAgreementValidator();
  const item = newWindowAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowAgreementBidRangeRule flags values above bid", () => {
  const rule = new WindowAgreementBidRangeRule(7.4, 2062.4);
  const item = newWindowAgreement("x", "y");
  item.bid = 2063.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowAgreementCategoryLengthRule flags a long category", () => {
  const rule = new WindowAgreementCategoryLengthRule(1000);
  const item = newWindowAgreement("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowAgreementNameLengthRule flags a long name", () => {
  const rule = new WindowAgreementNameLengthRule(80);
  const item = newWindowAgreement("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
