import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionDraftGraceDaysRangeRule,
  MentionDraftNameLengthRule,
  MentionDraftRequiredOwnerIdRule,
  defaultMentionDraftValidator,
} from "./mention-draft-rules.js";
import { newMentionDraft } from "./mention-draft.js";

test("MentionDraftValidator reports every problem", () => {
  const validator = defaultMentionDraftValidator();
  const item = newMentionDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionDraftRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new MentionDraftRequiredOwnerIdRule("mention draft needs an entry");
  const item = newMentionDraft("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionDraftGraceDaysRangeRule flags values above grace days", () => {
  const rule = new MentionDraftGraceDaysRangeRule(3600, 86400);
  const item = newMentionDraft("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionDraftNameLengthRule flags a long name", () => {
  const rule = new MentionDraftNameLengthRule(86400);
  const item = newMentionDraft("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
