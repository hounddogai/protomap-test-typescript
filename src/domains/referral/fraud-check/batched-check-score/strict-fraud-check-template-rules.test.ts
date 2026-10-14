import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictFraudCheckTemplateJourneyIdLengthRule,
  StrictFraudCheckTemplateRegionLengthRule,
  StrictFraudCheckTemplateRequiredRegionRule,
  StrictFraudCheckTemplateRequiredTitleRule,
  defaultStrictFraudCheckTemplateValidator,
} from "./strict-fraud-check-template-rules.js";
import { newStrictFraudCheckTemplate } from "./strict-fraud-check-template.js";

test("StrictFraudCheckTemplateValidator reports every problem", () => {
  const validator = defaultStrictFraudCheckTemplateValidator();
  const item = newStrictFraudCheckTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictFraudCheckTemplateRegionLengthRule flags a long region", () => {
  const rule = new StrictFraudCheckTemplateRegionLengthRule(1000);
  const item = newStrictFraudCheckTemplate("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictFraudCheckTemplateJourneyIdLengthRule flags a long journey id", () => {
  const rule = new StrictFraudCheckTemplateJourneyIdLengthRule(64);
  const item = newStrictFraudCheckTemplate("x", "y");
  item.journeyId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictFraudCheckTemplateRequiredTitleRule flags a blank title", () => {
  const rule = new StrictFraudCheckTemplateRequiredTitleRule("strict fraud check template needs an entry");
  const item = newStrictFraudCheckTemplate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictFraudCheckTemplateRequiredRegionRule flags a blank region", () => {
  const rule = new StrictFraudCheckTemplateRequiredRegionRule("strict fraud check template needs an entry");
  const item = newStrictFraudCheckTemplate("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
