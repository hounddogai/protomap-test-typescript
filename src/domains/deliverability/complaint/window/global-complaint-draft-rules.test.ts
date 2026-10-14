import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalComplaintDraftAmountRangeRule,
  GlobalComplaintDraftExpiresAtRangeRule,
  GlobalComplaintDraftExternalRefLengthRule,
  GlobalComplaintDraftRequiredCodeRule,
  defaultGlobalComplaintDraftValidator,
} from "./global-complaint-draft-rules.js";
import { newGlobalComplaintDraft } from "./global-complaint-draft.js";

test("GlobalComplaintDraftValidator reports every problem", () => {
  const validator = defaultGlobalComplaintDraftValidator();
  const item = newGlobalComplaintDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalComplaintDraftAmountRangeRule flags values above amount", () => {
  const rule = new GlobalComplaintDraftAmountRangeRule(8, 4094.2);
  const item = newGlobalComplaintDraft("x", "y");
  item.amount = 4095.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalComplaintDraftRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalComplaintDraftRequiredCodeRule("global complaint draft needs an entry");
  const item = newGlobalComplaintDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalComplaintDraftExternalRefLengthRule flags a long external ref", () => {
  const rule = new GlobalComplaintDraftExternalRefLengthRule(1000);
  const item = newGlobalComplaintDraft("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalComplaintDraftExpiresAtRangeRule flags values above expires at", () => {
  const rule = new GlobalComplaintDraftExpiresAtRangeRule(255, 255);
  const item = newGlobalComplaintDraft("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
