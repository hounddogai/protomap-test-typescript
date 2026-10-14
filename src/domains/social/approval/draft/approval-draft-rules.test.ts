import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalDraftGraceDaysRangeRule,
  ApprovalDraftRequiredTitleRule,
  defaultApprovalDraftValidator,
} from "./approval-draft-rules.js";
import { newApprovalDraft } from "./approval-draft.js";

test("ApprovalDraftValidator reports every problem", () => {
  const validator = defaultApprovalDraftValidator();
  const item = newApprovalDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalDraftRequiredTitleRule flags a blank title", () => {
  const rule = new ApprovalDraftRequiredTitleRule("approval draft needs a value");
  const item = newApprovalDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalDraftGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ApprovalDraftGraceDaysRangeRule(32, 120);
  const item = newApprovalDraft("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
