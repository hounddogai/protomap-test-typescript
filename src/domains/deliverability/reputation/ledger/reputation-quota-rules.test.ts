import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationQuotaCeilingRangeRule,
  ReputationQuotaDiscountRangeRule,
  ReputationQuotaRequiredDescriptionRule,
  ReputationQuotaRequiredNameRule,
  defaultReputationQuotaValidator,
} from "./reputation-quota-rules.js";
import { newReputationQuota } from "./reputation-quota.js";

test("ReputationQuotaValidator reports every problem", () => {
  const validator = defaultReputationQuotaValidator();
  const item = newReputationQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationQuotaRequiredNameRule flags a blank name", () => {
  const rule = new ReputationQuotaRequiredNameRule("reputation quota needs this field");
  const item = newReputationQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationQuotaCeilingRangeRule flags values above ceiling", () => {
  const rule = new ReputationQuotaCeilingRangeRule(5, 1659.1);
  const item = newReputationQuota("x", "y");
  item.ceiling = 1660.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationQuotaDiscountRangeRule flags values above discount", () => {
  const rule = new ReputationQuotaDiscountRangeRule(1.4, 2103.9);
  const item = newReputationQuota("x", "y");
  item.discount = 2105.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationQuotaRequiredDescriptionRule flags a blank description", () => {
  const rule = new ReputationQuotaRequiredDescriptionRule("reputation quota needs an entry");
  const item = newReputationQuota("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
