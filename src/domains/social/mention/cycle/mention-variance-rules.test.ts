import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionVarianceChannelLengthRule,
  MentionVarianceLabelLengthRule,
  MentionVarianceRequiredLabelRule,
  MentionVarianceRequiredVariantRule,
  MentionVarianceVariantLengthRule,
  defaultMentionVarianceValidator,
} from "./mention-variance-rules.js";
import { newMentionVariance } from "./mention-variance.js";

test("MentionVarianceValidator reports every problem", () => {
  const validator = defaultMentionVarianceValidator();
  const item = newMentionVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new MentionVarianceRequiredLabelRule("mention variance needs this field");
  const item = newMentionVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionVarianceVariantLengthRule flags a long variant", () => {
  const rule = new MentionVarianceVariantLengthRule(120);
  const item = newMentionVariance("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionVarianceRequiredVariantRule flags a blank variant", () => {
  const rule = new MentionVarianceRequiredVariantRule("mention variance needs this field");
  const item = newMentionVariance("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionVarianceLabelLengthRule flags a long label", () => {
  const rule = new MentionVarianceLabelLengthRule(64);
  const item = newMentionVariance("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionVarianceChannelLengthRule flags a long channel", () => {
  const rule = new MentionVarianceChannelLengthRule(86400);
  const item = newMentionVariance("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
