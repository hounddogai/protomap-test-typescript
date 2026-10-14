import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWarmupDraftContactEmailLengthRule,
  LenientWarmupDraftRequiredCodeRule,
  LenientWarmupDraftRequiredUtmSourceRule,
  LenientWarmupDraftUtmSourceLengthRule,
  defaultLenientWarmupDraftValidator,
} from "./lenient-warmup-draft-rules.js";
import { newLenientWarmupDraft } from "./lenient-warmup-draft.js";

test("LenientWarmupDraftValidator reports every problem", () => {
  const validator = defaultLenientWarmupDraftValidator();
  const item = newLenientWarmupDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWarmupDraftRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new LenientWarmupDraftRequiredUtmSourceRule("lenient warmup draft needs an entry");
  const item = newLenientWarmupDraft("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWarmupDraftUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientWarmupDraftUtmSourceLengthRule(80);
  const item = newLenientWarmupDraft("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWarmupDraftRequiredCodeRule flags a blank code", () => {
  const rule = new LenientWarmupDraftRequiredCodeRule("lenient warmup draft needs an entry");
  const item = newLenientWarmupDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientWarmupDraftContactEmailLengthRule flags a long contact email", () => {
  const rule = new LenientWarmupDraftContactEmailLengthRule(86400);
  const item = newLenientWarmupDraft("x", "y");
  item.contactEmail = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
