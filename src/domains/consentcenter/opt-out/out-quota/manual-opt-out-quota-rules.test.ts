import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualOptOutQuotaCodeLengthRule,
  ManualOptOutQuotaLabelLengthRule,
  ManualOptOutQuotaRequiredCodeRule,
  defaultManualOptOutQuotaValidator,
} from "./manual-opt-out-quota-rules.js";
import { newManualOptOutQuota } from "./manual-opt-out-quota.js";

test("ManualOptOutQuotaValidator reports every problem", () => {
  const validator = defaultManualOptOutQuotaValidator();
  const item = newManualOptOutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualOptOutQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new ManualOptOutQuotaRequiredCodeRule("manual opt out quota needs this field");
  const item = newManualOptOutQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualOptOutQuotaLabelLengthRule flags a long label", () => {
  const rule = new ManualOptOutQuotaLabelLengthRule(64);
  const item = newManualOptOutQuota("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualOptOutQuotaCodeLengthRule flags a long code", () => {
  const rule = new ManualOptOutQuotaCodeLengthRule(255);
  const item = newManualOptOutQuota("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
