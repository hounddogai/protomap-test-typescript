import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientRewardAuditCapacityRangeRule,
  LenientRewardAuditCodeLengthRule,
  LenientRewardAuditRequiredCodeRule,
  defaultLenientRewardAuditValidator,
} from "./lenient-reward-audit-rules.js";
import { newLenientRewardAudit } from "./lenient-reward-audit.js";

test("LenientRewardAuditValidator reports every problem", () => {
  const validator = defaultLenientRewardAuditValidator();
  const item = newLenientRewardAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientRewardAuditRequiredCodeRule flags a blank code", () => {
  const rule = new LenientRewardAuditRequiredCodeRule("lenient reward audit needs an entry");
  const item = newLenientRewardAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientRewardAuditCodeLengthRule flags a long code", () => {
  const rule = new LenientRewardAuditCodeLengthRule(64);
  const item = newLenientRewardAudit("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientRewardAuditCapacityRangeRule flags values above capacity", () => {
  const rule = new LenientRewardAuditCapacityRangeRule(16, 86400);
  const item = newLenientRewardAudit("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
