import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFraudCheckRecordCodeLengthRule,
  RollingFraudCheckRecordRequiredCodeRule,
  RollingFraudCheckRecordTitleLengthRule,
  defaultRollingFraudCheckRecordValidator,
} from "./rolling-fraud-check-record-rules.js";
import { newRollingFraudCheckRecord } from "./rolling-fraud-check-record.js";

test("RollingFraudCheckRecordValidator reports every problem", () => {
  const validator = defaultRollingFraudCheckRecordValidator();
  const item = newRollingFraudCheckRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFraudCheckRecordTitleLengthRule flags a long title", () => {
  const rule = new RollingFraudCheckRecordTitleLengthRule(120);
  const item = newRollingFraudCheckRecord("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingFraudCheckRecordRequiredCodeRule flags a blank code", () => {
  const rule = new RollingFraudCheckRecordRequiredCodeRule("rolling fraud check record needs an entry");
  const item = newRollingFraudCheckRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingFraudCheckRecordCodeLengthRule flags a long code", () => {
  const rule = new RollingFraudCheckRecordCodeLengthRule(86400);
  const item = newRollingFraudCheckRecord("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
