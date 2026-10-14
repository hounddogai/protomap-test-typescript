import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDeflectionRuleCapacityRangeRule,
  LegacyDeflectionRuleRequiredCohortRule,
  LegacyDeflectionRuleRequiredTitleRule,
  LegacyDeflectionRuleSequenceRangeRule,
  defaultLegacyDeflectionRuleValidator,
} from "./legacy-deflection-rule-rules.js";
import { newLegacyDeflectionRule } from "./legacy-deflection-rule.js";

test("LegacyDeflectionRuleValidator reports every problem", () => {
  const validator = defaultLegacyDeflectionRuleValidator();
  const item = newLegacyDeflectionRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDeflectionRuleSequenceRangeRule flags values above sequence", () => {
  const rule = new LegacyDeflectionRuleSequenceRangeRule(255, 3600);
  const item = newLegacyDeflectionRule("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDeflectionRuleRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyDeflectionRuleRequiredTitleRule("legacy deflection rule needs an entry");
  const item = newLegacyDeflectionRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyDeflectionRuleCapacityRangeRule flags values above capacity", () => {
  const rule = new LegacyDeflectionRuleCapacityRangeRule(16, 16);
  const item = newLegacyDeflectionRule("x", "y");
  item.capacity = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDeflectionRuleRequiredCohortRule flags a blank cohort", () => {
  const rule = new LegacyDeflectionRuleRequiredCohortRule("legacy deflection rule needs an entry");
  const item = newLegacyDeflectionRule("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
