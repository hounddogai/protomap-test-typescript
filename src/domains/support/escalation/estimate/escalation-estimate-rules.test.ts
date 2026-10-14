import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationEstimateAudienceIdLengthRule,
  EscalationEstimateRequiredAudienceIdRule,
  EscalationEstimateRequiredContactEmailRule,
  EscalationEstimateRequiredNameRule,
  EscalationEstimateScoreRangeRule,
  defaultEscalationEstimateValidator,
} from "./escalation-estimate-rules.js";
import { newEscalationEstimate } from "./escalation-estimate.js";

test("EscalationEstimateValidator reports every problem", () => {
  const validator = defaultEscalationEstimateValidator();
  const item = newEscalationEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationEstimateRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new EscalationEstimateRequiredAudienceIdRule("escalation estimate needs this field");
  const item = newEscalationEstimate("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationEstimateScoreRangeRule flags values above score", () => {
  const rule = new EscalationEstimateScoreRangeRule(3.4, 1870.2);
  const item = newEscalationEstimate("x", "y");
  item.score = 1871.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationEstimateAudienceIdLengthRule flags a long audience id", () => {
  const rule = new EscalationEstimateAudienceIdLengthRule(32);
  const item = newEscalationEstimate("x", "y");
  item.audienceId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationEstimateRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new EscalationEstimateRequiredContactEmailRule("escalation estimate needs an entry");
  const item = newEscalationEstimate("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationEstimateRequiredNameRule flags a blank name", () => {
  const rule = new EscalationEstimateRequiredNameRule("escalation estimate needs a value");
  const item = newEscalationEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
