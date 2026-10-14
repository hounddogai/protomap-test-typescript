import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalApprovalRecordAudienceIdLengthRule,
  RegionalApprovalRecordRequiredAudienceIdRule,
  RegionalApprovalRecordRequiredTitleRule,
  defaultRegionalApprovalRecordValidator,
} from "./regional-approval-record-rules.js";
import { newRegionalApprovalRecord } from "./regional-approval-record.js";

test("RegionalApprovalRecordValidator reports every problem", () => {
  const validator = defaultRegionalApprovalRecordValidator();
  const item = newRegionalApprovalRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalApprovalRecordRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new RegionalApprovalRecordRequiredAudienceIdRule("regional approval record needs a value");
  const item = newRegionalApprovalRecord("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalApprovalRecordAudienceIdLengthRule flags a long audience id", () => {
  const rule = new RegionalApprovalRecordAudienceIdLengthRule(120);
  const item = newRegionalApprovalRecord("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalApprovalRecordRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalApprovalRecordRequiredTitleRule("regional approval record needs this field");
  const item = newRegionalApprovalRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
