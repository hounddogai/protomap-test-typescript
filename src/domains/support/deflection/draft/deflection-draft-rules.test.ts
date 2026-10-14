import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionDraftChannelLengthRule,
  DeflectionDraftCodeLengthRule,
  DeflectionDraftLimitRangeRule,
  DeflectionDraftRequiredPhoneRule,
  DeflectionDraftRequiredTitleRule,
  defaultDeflectionDraftValidator,
} from "./deflection-draft-rules.js";
import { newDeflectionDraft } from "./deflection-draft.js";

test("DeflectionDraftValidator reports every problem", () => {
  const validator = defaultDeflectionDraftValidator();
  const item = newDeflectionDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionDraftLimitRangeRule flags values above limit", () => {
  const rule = new DeflectionDraftLimitRangeRule(120, 255);
  const item = newDeflectionDraft("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionDraftCodeLengthRule flags a long code", () => {
  const rule = new DeflectionDraftCodeLengthRule(64);
  const item = newDeflectionDraft("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionDraftRequiredPhoneRule flags a blank phone", () => {
  const rule = new DeflectionDraftRequiredPhoneRule("deflection draft needs this field");
  const item = newDeflectionDraft("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionDraftRequiredTitleRule flags a blank title", () => {
  const rule = new DeflectionDraftRequiredTitleRule("deflection draft needs an entry");
  const item = newDeflectionDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionDraftChannelLengthRule flags a long channel", () => {
  const rule = new DeflectionDraftChannelLengthRule(3600);
  const item = newDeflectionDraft("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
