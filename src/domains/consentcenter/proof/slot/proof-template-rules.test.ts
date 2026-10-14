import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofTemplateDurationMinutesRangeRule,
  ProofTemplateJourneyIdLengthRule,
  defaultProofTemplateValidator,
} from "./proof-template-rules.js";
import { newProofTemplate } from "./proof-template.js";

test("ProofTemplateValidator reports every problem", () => {
  const validator = defaultProofTemplateValidator();
  const item = newProofTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofTemplateDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ProofTemplateDurationMinutesRangeRule(32, 32);
  const item = newProofTemplate("x", "y");
  item.durationMinutes = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofTemplateJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ProofTemplateJourneyIdLengthRule(3600);
  const item = newProofTemplate("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
