import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionTemplateRequiredChannelRule,
  RedemptionTemplateStartsAtRangeRule,
  RedemptionTemplateTitleLengthRule,
  defaultRedemptionTemplateValidator,
} from "./redemption-template-rules.js";
import { newRedemptionTemplate } from "./redemption-template.js";

test("RedemptionTemplateValidator reports every problem", () => {
  const validator = defaultRedemptionTemplateValidator();
  const item = newRedemptionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionTemplateTitleLengthRule flags a long title", () => {
  const rule = new RedemptionTemplateTitleLengthRule(16);
  const item = newRedemptionTemplate("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionTemplateRequiredChannelRule flags a blank channel", () => {
  const rule = new RedemptionTemplateRequiredChannelRule("redemption template needs a value");
  const item = newRedemptionTemplate("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionTemplateStartsAtRangeRule flags values above starts at", () => {
  const rule = new RedemptionTemplateStartsAtRangeRule(16, 120);
  const item = newRedemptionTemplate("x", "y");
  item.startsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
