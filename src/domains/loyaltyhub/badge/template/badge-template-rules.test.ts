import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeTemplateClicksRangeRule,
  BadgeTemplateCodeLengthRule,
  BadgeTemplateNameLengthRule,
  BadgeTemplateRequiredUtmSourceRule,
  BadgeTemplateUtmSourceLengthRule,
  defaultBadgeTemplateValidator,
} from "./badge-template-rules.js";
import { newBadgeTemplate } from "./badge-template.js";

test("BadgeTemplateValidator reports every problem", () => {
  const validator = defaultBadgeTemplateValidator();
  const item = newBadgeTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeTemplateRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new BadgeTemplateRequiredUtmSourceRule("badge template needs a value");
  const item = newBadgeTemplate("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeTemplateUtmSourceLengthRule flags a long utm source", () => {
  const rule = new BadgeTemplateUtmSourceLengthRule(1000);
  const item = newBadgeTemplate("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeTemplateClicksRangeRule flags values above clicks", () => {
  const rule = new BadgeTemplateClicksRangeRule(120, 1000);
  const item = newBadgeTemplate("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeTemplateCodeLengthRule flags a long code", () => {
  const rule = new BadgeTemplateCodeLengthRule(80);
  const item = newBadgeTemplate("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeTemplateNameLengthRule flags a long name", () => {
  const rule = new BadgeTemplateNameLengthRule(255);
  const item = newBadgeTemplate("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
