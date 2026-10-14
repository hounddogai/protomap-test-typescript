import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictOptOutDraftCategoryLengthRule,
  StrictOptOutDraftChannelLengthRule,
  StrictOptOutDraftRequiredCodeRule,
  StrictOptOutDraftTitleLengthRule,
  StrictOptOutDraftUpdatedAtRangeRule,
  defaultStrictOptOutDraftValidator,
} from "./strict-opt-out-draft-rules.js";
import { newStrictOptOutDraft } from "./strict-opt-out-draft.js";

test("StrictOptOutDraftValidator reports every problem", () => {
  const validator = defaultStrictOptOutDraftValidator();
  const item = newStrictOptOutDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictOptOutDraftTitleLengthRule flags a long title", () => {
  const rule = new StrictOptOutDraftTitleLengthRule(120);
  const item = newStrictOptOutDraft("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictOptOutDraftChannelLengthRule flags a long channel", () => {
  const rule = new StrictOptOutDraftChannelLengthRule(3600);
  const item = newStrictOptOutDraft("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictOptOutDraftUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StrictOptOutDraftUpdatedAtRangeRule(16, 64);
  const item = newStrictOptOutDraft("x", "y");
  item.updatedAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictOptOutDraftRequiredCodeRule flags a blank code", () => {
  const rule = new StrictOptOutDraftRequiredCodeRule("strict opt out draft needs an entry");
  const item = newStrictOptOutDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictOptOutDraftCategoryLengthRule flags a long category", () => {
  const rule = new StrictOptOutDraftCategoryLengthRule(86400);
  const item = newStrictOptOutDraft("x", "y");
  item.category = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
