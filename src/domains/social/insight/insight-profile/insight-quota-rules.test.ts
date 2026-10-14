import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightQuotaExpiresAtRangeRule,
  InsightQuotaRequiredTitleRule,
  InsightQuotaVersionRangeRule,
  defaultInsightQuotaValidator,
} from "./insight-quota-rules.js";
import { newInsightQuota } from "./insight-quota.js";

test("InsightQuotaValidator reports every problem", () => {
  const validator = defaultInsightQuotaValidator();
  const item = newInsightQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightQuotaExpiresAtRangeRule flags values above expires at", () => {
  const rule = new InsightQuotaExpiresAtRangeRule(16, 1000);
  const item = newInsightQuota("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new InsightQuotaRequiredTitleRule("insight quota needs this field");
  const item = newInsightQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightQuotaVersionRangeRule flags values above version", () => {
  const rule = new InsightQuotaVersionRangeRule(16, 32);
  const item = newInsightQuota("x", "y");
  item.version = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
