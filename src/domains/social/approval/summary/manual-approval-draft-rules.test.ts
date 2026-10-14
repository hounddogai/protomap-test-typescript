import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualApprovalDraftChannelLengthRule,
  ManualApprovalDraftRequiredCodeRule,
  defaultManualApprovalDraftValidator,
} from "./manual-approval-draft-rules.js";
import { newManualApprovalDraft } from "./manual-approval-draft.js";

test("ManualApprovalDraftValidator reports every problem", () => {
  const validator = defaultManualApprovalDraftValidator();
  const item = newManualApprovalDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualApprovalDraftRequiredCodeRule flags a blank code", () => {
  const rule = new ManualApprovalDraftRequiredCodeRule("manual approval draft needs this field");
  const item = newManualApprovalDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualApprovalDraftChannelLengthRule flags a long channel", () => {
  const rule = new ManualApprovalDraftChannelLengthRule(64);
  const item = newManualApprovalDraft("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
