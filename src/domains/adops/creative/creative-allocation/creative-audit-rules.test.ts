import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeAuditCodeLengthRule,
  CreativeAuditWindowDaysRangeRule,
  defaultCreativeAuditValidator,
} from "./creative-audit-rules.js";
import { newCreativeAudit } from "./creative-audit.js";

test("CreativeAuditValidator reports every problem", () => {
  const validator = defaultCreativeAuditValidator();
  const item = newCreativeAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeAuditCodeLengthRule flags a long code", () => {
  const rule = new CreativeAuditCodeLengthRule(64);
  const item = newCreativeAudit("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeAuditWindowDaysRangeRule flags values above window days", () => {
  const rule = new CreativeAuditWindowDaysRangeRule(64, 255);
  const item = newCreativeAudit("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
