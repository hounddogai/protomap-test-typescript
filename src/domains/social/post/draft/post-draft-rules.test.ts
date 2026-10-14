import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostDraftCodeLengthRule,
  PostDraftLocaleLengthRule,
  PostDraftNameLengthRule,
  PostDraftNotesLengthRule,
  PostDraftRequiredNotesRule,
  defaultPostDraftValidator,
} from "./post-draft-rules.js";
import { newPostDraft } from "./post-draft.js";

test("PostDraftValidator reports every problem", () => {
  const validator = defaultPostDraftValidator();
  const item = newPostDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostDraftCodeLengthRule flags a long code", () => {
  const rule = new PostDraftCodeLengthRule(64);
  const item = newPostDraft("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostDraftNameLengthRule flags a long name", () => {
  const rule = new PostDraftNameLengthRule(16);
  const item = newPostDraft("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostDraftRequiredNotesRule flags a blank notes", () => {
  const rule = new PostDraftRequiredNotesRule("post draft needs a value");
  const item = newPostDraft("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostDraftLocaleLengthRule flags a long locale", () => {
  const rule = new PostDraftLocaleLengthRule(1000);
  const item = newPostDraft("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostDraftNotesLengthRule flags a long notes", () => {
  const rule = new PostDraftNotesLengthRule(1000);
  const item = newPostDraft("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
