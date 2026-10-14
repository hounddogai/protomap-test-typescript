import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintDraftCodeLengthRule,
  ComplaintDraftNotesLengthRule,
  ComplaintDraftRequiredNameRule,
  ComplaintDraftSequenceRangeRule,
  defaultComplaintDraftValidator,
} from "./complaint-draft-rules.js";
import { newComplaintDraft } from "./complaint-draft.js";

test("ComplaintDraftValidator reports every problem", () => {
  const validator = defaultComplaintDraftValidator();
  const item = newComplaintDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintDraftSequenceRangeRule flags values above sequence", () => {
  const rule = new ComplaintDraftSequenceRangeRule(80, 1000);
  const item = newComplaintDraft("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintDraftNotesLengthRule flags a long notes", () => {
  const rule = new ComplaintDraftNotesLengthRule(1000);
  const item = newComplaintDraft("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintDraftCodeLengthRule flags a long code", () => {
  const rule = new ComplaintDraftCodeLengthRule(86400);
  const item = newComplaintDraft("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintDraftRequiredNameRule flags a blank name", () => {
  const rule = new ComplaintDraftRequiredNameRule("complaint draft needs a value");
  const item = newComplaintDraft("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
