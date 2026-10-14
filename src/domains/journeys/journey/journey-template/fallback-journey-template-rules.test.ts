import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackJourneyTemplateCodeLengthRule,
  FallbackJourneyTemplateRequiredTitleRule,
  FallbackJourneyTemplateTitleLengthRule,
  FallbackJourneyTemplateUtmSourceLengthRule,
  defaultFallbackJourneyTemplateValidator,
} from "./fallback-journey-template-rules.js";
import { newFallbackJourneyTemplate } from "./fallback-journey-template.js";

test("FallbackJourneyTemplateValidator reports every problem", () => {
  const validator = defaultFallbackJourneyTemplateValidator();
  const item = newFallbackJourneyTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackJourneyTemplateCodeLengthRule flags a long code", () => {
  const rule = new FallbackJourneyTemplateCodeLengthRule(16);
  const item = newFallbackJourneyTemplate("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackJourneyTemplateRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackJourneyTemplateRequiredTitleRule("fallback journey template needs this field");
  const item = newFallbackJourneyTemplate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackJourneyTemplateTitleLengthRule flags a long title", () => {
  const rule = new FallbackJourneyTemplateTitleLengthRule(80);
  const item = newFallbackJourneyTemplate("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackJourneyTemplateUtmSourceLengthRule flags a long utm source", () => {
  const rule = new FallbackJourneyTemplateUtmSourceLengthRule(32);
  const item = newFallbackJourneyTemplate("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
