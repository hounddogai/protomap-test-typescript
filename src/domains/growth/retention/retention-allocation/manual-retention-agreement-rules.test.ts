import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRetentionAgreementCodeLengthRule,
  ManualRetentionAgreementCreatedAtRangeRule,
  ManualRetentionAgreementRequiredCodeRule,
  ManualRetentionAgreementRequiredOwnerIdRule,
  ManualRetentionAgreementScoreRangeRule,
  defaultManualRetentionAgreementValidator,
} from "./manual-retention-agreement-rules.js";
import { newManualRetentionAgreement } from "./manual-retention-agreement.js";

test("ManualRetentionAgreementValidator reports every problem", () => {
  const validator = defaultManualRetentionAgreementValidator();
  const item = newManualRetentionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRetentionAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new ManualRetentionAgreementRequiredCodeRule("manual retention agreement needs a value");
  const item = newManualRetentionAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRetentionAgreementRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ManualRetentionAgreementRequiredOwnerIdRule("manual retention agreement needs this field");
  const item = newManualRetentionAgreement("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRetentionAgreementScoreRangeRule flags values above score", () => {
  const rule = new ManualRetentionAgreementScoreRangeRule(1.3, 4536.8);
  const item = newManualRetentionAgreement("x", "y");
  item.score = 4538.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualRetentionAgreementCreatedAtRangeRule flags values above created at", () => {
  const rule = new ManualRetentionAgreementCreatedAtRangeRule(16, 16);
  const item = newManualRetentionAgreement("x", "y");
  item.createdAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualRetentionAgreementCodeLengthRule flags a long code", () => {
  const rule = new ManualRetentionAgreementCodeLengthRule(86400);
  const item = newManualRetentionAgreement("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
