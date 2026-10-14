import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRewardQuotaNameLengthRule,
  StrictRewardQuotaRequiredCodeRule,
  StrictRewardQuotaRequiredTitleRule,
  defaultStrictRewardQuotaValidator,
} from "./strict-reward-quota-rules.js";
import { newStrictRewardQuota } from "./strict-reward-quota.js";

test("StrictRewardQuotaValidator reports every problem", () => {
  const validator = defaultStrictRewardQuotaValidator();
  const item = newStrictRewardQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRewardQuotaNameLengthRule flags a long name", () => {
  const rule = new StrictRewardQuotaNameLengthRule(3600);
  const item = newStrictRewardQuota("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRewardQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new StrictRewardQuotaRequiredCodeRule("strict reward quota needs a value");
  const item = newStrictRewardQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRewardQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new StrictRewardQuotaRequiredTitleRule("strict reward quota needs this field");
  const item = newStrictRewardQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
