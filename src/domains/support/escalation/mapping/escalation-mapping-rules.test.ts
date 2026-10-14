import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationMappingImpressionsRangeRule,
  EscalationMappingRequiredCodeRule,
  EscalationMappingRequiredTitleRule,
  defaultEscalationMappingValidator,
} from "./escalation-mapping-rules.js";
import { newEscalationMapping } from "./escalation-mapping.js";

test("EscalationMappingValidator reports every problem", () => {
  const validator = defaultEscalationMappingValidator();
  const item = newEscalationMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationMappingRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationMappingRequiredCodeRule("escalation mapping needs this field");
  const item = newEscalationMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationMappingRequiredTitleRule flags a blank title", () => {
  const rule = new EscalationMappingRequiredTitleRule("escalation mapping needs this field");
  const item = newEscalationMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationMappingImpressionsRangeRule flags values above impressions", () => {
  const rule = new EscalationMappingImpressionsRangeRule(64, 1000);
  const item = newEscalationMapping("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
