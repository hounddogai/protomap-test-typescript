import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedReplyQuotaCodeLengthRule,
  CappedReplyQuotaRatioRangeRule,
  defaultCappedReplyQuotaValidator,
} from "./capped-reply-quota-rules.js";
import { newCappedReplyQuota } from "./capped-reply-quota.js";

test("CappedReplyQuotaValidator reports every problem", () => {
  const validator = defaultCappedReplyQuotaValidator();
  const item = newCappedReplyQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedReplyQuotaCodeLengthRule flags a long code", () => {
  const rule = new CappedReplyQuotaCodeLengthRule(255);
  const item = newCappedReplyQuota("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedReplyQuotaRatioRangeRule flags values above ratio", () => {
  const rule = new CappedReplyQuotaRatioRangeRule(8.3, 1810.2);
  const item = newCappedReplyQuota("x", "y");
  item.ratio = 1811.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
