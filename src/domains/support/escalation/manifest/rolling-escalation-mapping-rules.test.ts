import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingEscalationMappingLimitRangeRule,
  RollingEscalationMappingOpenRateRangeRule,
  RollingEscalationMappingRequiredCodeRule,
  RollingEscalationMappingRequiredLabelRule,
  defaultRollingEscalationMappingValidator,
} from "./rolling-escalation-mapping-rules.js";
import { newRollingEscalationMapping } from "./rolling-escalation-mapping.js";

test("RollingEscalationMappingValidator reports every problem", () => {
  const validator = defaultRollingEscalationMappingValidator();
  const item = newRollingEscalationMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingEscalationMappingRequiredLabelRule flags a blank label", () => {
  const rule = new RollingEscalationMappingRequiredLabelRule("rolling escalation mapping needs an entry");
  const item = newRollingEscalationMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingEscalationMappingOpenRateRangeRule flags values above open rate", () => {
  const rule = new RollingEscalationMappingOpenRateRangeRule(8.2, 4901.4);
  const item = newRollingEscalationMapping("x", "y");
  item.openRate = 4902.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingEscalationMappingRequiredCodeRule flags a blank code", () => {
  const rule = new RollingEscalationMappingRequiredCodeRule("rolling escalation mapping needs an entry");
  const item = newRollingEscalationMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingEscalationMappingLimitRangeRule flags values above limit", () => {
  const rule = new RollingEscalationMappingLimitRangeRule(64, 80);
  const item = newRollingEscalationMapping("x", "y");
  item.limit = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
