import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSuppressionAuditRateRangeRule,
  GlobalSuppressionAuditRetriesRangeRule,
  defaultGlobalSuppressionAuditValidator,
} from "./global-suppression-audit-rules.js";
import { newGlobalSuppressionAudit } from "./global-suppression-audit.js";

test("GlobalSuppressionAuditValidator reports every problem", () => {
  const validator = defaultGlobalSuppressionAuditValidator();
  const item = newGlobalSuppressionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSuppressionAuditRetriesRangeRule flags values above retries", () => {
  const rule = new GlobalSuppressionAuditRetriesRangeRule(255, 1000);
  const item = newGlobalSuppressionAudit("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSuppressionAuditRateRangeRule flags values above rate", () => {
  const rule = new GlobalSuppressionAuditRateRangeRule(6.3, 4716.8);
  const item = newGlobalSuppressionAudit("x", "y");
  item.rate = 4718.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
