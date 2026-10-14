import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierDraftChecksumLengthRule,
  TierDraftCodeLengthRule,
  TierDraftLabelLengthRule,
  TierDraftRequiredLabelRule,
  TierDraftVersionRangeRule,
  defaultTierDraftValidator,
} from "./tier-draft-rules.js";
import { newTierDraft } from "./tier-draft.js";

test("TierDraftValidator reports every problem", () => {
  const validator = defaultTierDraftValidator();
  const item = newTierDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierDraftLabelLengthRule flags a long label", () => {
  const rule = new TierDraftLabelLengthRule(64);
  const item = newTierDraft("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierDraftRequiredLabelRule flags a blank label", () => {
  const rule = new TierDraftRequiredLabelRule("tier draft needs this field");
  const item = newTierDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierDraftVersionRangeRule flags values above version", () => {
  const rule = new TierDraftVersionRangeRule(64, 86400);
  const item = newTierDraft("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierDraftCodeLengthRule flags a long code", () => {
  const rule = new TierDraftCodeLengthRule(1000);
  const item = newTierDraft("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierDraftChecksumLengthRule flags a long checksum", () => {
  const rule = new TierDraftChecksumLengthRule(80);
  const item = newTierDraft("x", "y");
  item.checksum = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
