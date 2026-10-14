import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualDoubleOptInDraftCodeLengthRule,
  ManualDoubleOptInDraftRequiredCodeRule,
  ManualDoubleOptInDraftRequiredDescriptionRule,
  ManualDoubleOptInDraftUpdatedAtRangeRule,
  defaultManualDoubleOptInDraftValidator,
} from "./manual-double-opt-in-draft-rules.js";
import { newManualDoubleOptInDraft } from "./manual-double-opt-in-draft.js";

test("ManualDoubleOptInDraftValidator reports every problem", () => {
  const validator = defaultManualDoubleOptInDraftValidator();
  const item = newManualDoubleOptInDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualDoubleOptInDraftCodeLengthRule flags a long code", () => {
  const rule = new ManualDoubleOptInDraftCodeLengthRule(64);
  const item = newManualDoubleOptInDraft("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualDoubleOptInDraftUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ManualDoubleOptInDraftUpdatedAtRangeRule(64, 255);
  const item = newManualDoubleOptInDraft("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualDoubleOptInDraftRequiredCodeRule flags a blank code", () => {
  const rule = new ManualDoubleOptInDraftRequiredCodeRule("manual double opt in draft needs a value");
  const item = newManualDoubleOptInDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualDoubleOptInDraftRequiredDescriptionRule flags a blank description", () => {
  const rule = new ManualDoubleOptInDraftRequiredDescriptionRule("manual double opt in draft needs a value");
  const item = newManualDoubleOptInDraft("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
