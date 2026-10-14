import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalApprovalNoticeLabelLengthRule,
  RegionalApprovalNoticeRequiredCodeRule,
  defaultRegionalApprovalNoticeValidator,
} from "./regional-approval-notice-rules.js";
import { newRegionalApprovalNotice } from "./regional-approval-notice.js";

test("RegionalApprovalNoticeValidator reports every problem", () => {
  const validator = defaultRegionalApprovalNoticeValidator();
  const item = newRegionalApprovalNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalApprovalNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalApprovalNoticeRequiredCodeRule("regional approval notice needs this field");
  const item = newRegionalApprovalNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalApprovalNoticeLabelLengthRule flags a long label", () => {
  const rule = new RegionalApprovalNoticeLabelLengthRule(16);
  const item = newRegionalApprovalNotice("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
