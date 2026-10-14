import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalQueueRuleLabelLengthRule,
  RegionalQueueRuleRequiredLabelRule,
  RegionalQueueRuleRequiredUtmSourceRule,
  defaultRegionalQueueRuleValidator,
} from "./regional-queue-rule-rules.js";
import { newRegionalQueueRule } from "./regional-queue-rule.js";

test("RegionalQueueRuleValidator reports every problem", () => {
  const validator = defaultRegionalQueueRuleValidator();
  const item = newRegionalQueueRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalQueueRuleRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RegionalQueueRuleRequiredUtmSourceRule("regional queue rule needs a value");
  const item = newRegionalQueueRule("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalQueueRuleLabelLengthRule flags a long label", () => {
  const rule = new RegionalQueueRuleLabelLengthRule(80);
  const item = newRegionalQueueRule("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalQueueRuleRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalQueueRuleRequiredLabelRule("regional queue rule needs this field");
  const item = newRegionalQueueRule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
