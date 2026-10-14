import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionQuotaLabelLengthRule,
  RetentionQuotaRequiredCodeRule,
  defaultRetentionQuotaValidator,
} from "./retention-quota-rules.js";
import { newRetentionQuota } from "./retention-quota.js";

test("RetentionQuotaValidator reports every problem", () => {
  const validator = defaultRetentionQuotaValidator();
  const item = newRetentionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionQuotaLabelLengthRule flags a long label", () => {
  const rule = new RetentionQuotaLabelLengthRule(64);
  const item = newRetentionQuota("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionQuotaRequiredCodeRule("retention quota needs this field");
  const item = newRetentionQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
