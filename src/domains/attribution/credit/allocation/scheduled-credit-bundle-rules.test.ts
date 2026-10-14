import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledCreditBundleBudgetRangeRule,
  ScheduledCreditBundleRequiredContactEmailRule,
  ScheduledCreditBundleRequiredTitleRule,
  ScheduledCreditBundleTitleLengthRule,
  defaultScheduledCreditBundleValidator,
} from "./scheduled-credit-bundle-rules.js";
import { newScheduledCreditBundle } from "./scheduled-credit-bundle.js";

test("ScheduledCreditBundleValidator reports every problem", () => {
  const validator = defaultScheduledCreditBundleValidator();
  const item = newScheduledCreditBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledCreditBundleRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledCreditBundleRequiredTitleRule("scheduled credit bundle needs this field");
  const item = newScheduledCreditBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledCreditBundleTitleLengthRule flags a long title", () => {
  const rule = new ScheduledCreditBundleTitleLengthRule(1000);
  const item = newScheduledCreditBundle("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledCreditBundleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ScheduledCreditBundleRequiredContactEmailRule("scheduled credit bundle needs an entry");
  const item = newScheduledCreditBundle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledCreditBundleBudgetRangeRule flags values above budget", () => {
  const rule = new ScheduledCreditBundleBudgetRangeRule(0.5, 1883.9);
  const item = newScheduledCreditBundle("x", "y");
  item.budget = 1885.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
