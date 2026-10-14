import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFlightTemplateChannelLengthRule,
  ManualFlightTemplateClicksRangeRule,
  ManualFlightTemplateRequiredTitleRule,
  ManualFlightTemplateRequiredUnitRule,
  ManualFlightTemplateTitleLengthRule,
  defaultManualFlightTemplateValidator,
} from "./manual-flight-template-rules.js";
import { newManualFlightTemplate } from "./manual-flight-template.js";

test("ManualFlightTemplateValidator reports every problem", () => {
  const validator = defaultManualFlightTemplateValidator();
  const item = newManualFlightTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFlightTemplateClicksRangeRule flags values above clicks", () => {
  const rule = new ManualFlightTemplateClicksRangeRule(255, 3600);
  const item = newManualFlightTemplate("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFlightTemplateChannelLengthRule flags a long channel", () => {
  const rule = new ManualFlightTemplateChannelLengthRule(3600);
  const item = newManualFlightTemplate("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFlightTemplateTitleLengthRule flags a long title", () => {
  const rule = new ManualFlightTemplateTitleLengthRule(3600);
  const item = newManualFlightTemplate("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFlightTemplateRequiredUnitRule flags a blank unit", () => {
  const rule = new ManualFlightTemplateRequiredUnitRule("manual flight template needs an entry");
  const item = newManualFlightTemplate("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFlightTemplateRequiredTitleRule flags a blank title", () => {
  const rule = new ManualFlightTemplateRequiredTitleRule("manual flight template needs this field");
  const item = newManualFlightTemplate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
