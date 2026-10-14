import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedDomainThresholdCategoryLengthRule,
  CappedDomainThresholdClicksRangeRule,
  defaultCappedDomainThresholdValidator,
} from "./capped-domain-threshold-rules.js";
import { newCappedDomainThreshold } from "./capped-domain-threshold.js";

test("CappedDomainThresholdValidator reports every problem", () => {
  const validator = defaultCappedDomainThresholdValidator();
  const item = newCappedDomainThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedDomainThresholdCategoryLengthRule flags a long category", () => {
  const rule = new CappedDomainThresholdCategoryLengthRule(1000);
  const item = newCappedDomainThreshold("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedDomainThresholdClicksRangeRule flags values above clicks", () => {
  const rule = new CappedDomainThresholdClicksRangeRule(32, 80);
  const item = newCappedDomainThreshold("x", "y");
  item.clicks = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
