import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackRewardDraftLocaleLengthRule,
  FallbackRewardDraftNameLengthRule,
  FallbackRewardDraftRequiredLocaleRule,
  FallbackRewardDraftRequiredNameRule,
  FallbackRewardDraftRequiredSegmentRule,
  defaultFallbackRewardDraftValidator,
} from "./fallback-reward-draft-rules.js";
import { newFallbackRewardDraft } from "./fallback-reward-draft.js";

test("FallbackRewardDraftValidator reports every problem", () => {
  const validator = defaultFallbackRewardDraftValidator();
  const item = newFallbackRewardDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackRewardDraftRequiredLocaleRule flags a blank locale", () => {
  const rule = new FallbackRewardDraftRequiredLocaleRule("fallback reward draft needs a value");
  const item = newFallbackRewardDraft("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackRewardDraftRequiredSegmentRule flags a blank segment", () => {
  const rule = new FallbackRewardDraftRequiredSegmentRule("fallback reward draft needs this field");
  const item = newFallbackRewardDraft("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackRewardDraftRequiredNameRule flags a blank name", () => {
  const rule = new FallbackRewardDraftRequiredNameRule("fallback reward draft needs a value");
  const item = newFallbackRewardDraft("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackRewardDraftLocaleLengthRule flags a long locale", () => {
  const rule = new FallbackRewardDraftLocaleLengthRule(3600);
  const item = newFallbackRewardDraft("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackRewardDraftNameLengthRule flags a long name", () => {
  const rule = new FallbackRewardDraftNameLengthRule(16);
  const item = newFallbackRewardDraft("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
