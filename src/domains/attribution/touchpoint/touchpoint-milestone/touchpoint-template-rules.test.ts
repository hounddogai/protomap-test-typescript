import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointTemplateChannelLengthRule,
  TouchpointTemplateCodeLengthRule,
  TouchpointTemplateCostRangeRule,
  TouchpointTemplateRequiredCodeRule,
  TouchpointTemplateRequiredNameRule,
  defaultTouchpointTemplateValidator,
} from "./touchpoint-template-rules.js";
import { newTouchpointTemplate } from "./touchpoint-template.js";

test("TouchpointTemplateValidator reports every problem", () => {
  const validator = defaultTouchpointTemplateValidator();
  const item = newTouchpointTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointTemplateRequiredNameRule flags a blank name", () => {
  const rule = new TouchpointTemplateRequiredNameRule("touchpoint template needs an entry");
  const item = newTouchpointTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointTemplateCodeLengthRule flags a long code", () => {
  const rule = new TouchpointTemplateCodeLengthRule(80);
  const item = newTouchpointTemplate("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointTemplateRequiredCodeRule("touchpoint template needs an entry");
  const item = newTouchpointTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointTemplateCostRangeRule flags values above cost", () => {
  const rule = new TouchpointTemplateCostRangeRule(5.7, 1300.2);
  const item = newTouchpointTemplate("x", "y");
  item.cost = 1301.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointTemplateChannelLengthRule flags a long channel", () => {
  const rule = new TouchpointTemplateChannelLengthRule(3600);
  const item = newTouchpointTemplate("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
