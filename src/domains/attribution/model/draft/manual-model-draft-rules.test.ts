import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualModelDraftCodeLengthRule,
  ManualModelDraftRequiredCodeRule,
  ManualModelDraftVersionRangeRule,
  ManualModelDraftWindowDaysRangeRule,
  defaultManualModelDraftValidator,
} from "./manual-model-draft-rules.js";
import { newManualModelDraft } from "./manual-model-draft.js";

test("ManualModelDraftValidator reports every problem", () => {
  const validator = defaultManualModelDraftValidator();
  const item = newManualModelDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualModelDraftRequiredCodeRule flags a blank code", () => {
  const rule = new ManualModelDraftRequiredCodeRule("manual model draft needs an entry");
  const item = newManualModelDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualModelDraftCodeLengthRule flags a long code", () => {
  const rule = new ManualModelDraftCodeLengthRule(64);
  const item = newManualModelDraft("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualModelDraftVersionRangeRule flags values above version", () => {
  const rule = new ManualModelDraftVersionRangeRule(64, 86400);
  const item = newManualModelDraft("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualModelDraftWindowDaysRangeRule flags values above window days", () => {
  const rule = new ManualModelDraftWindowDaysRangeRule(80, 3600);
  const item = newManualModelDraft("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
