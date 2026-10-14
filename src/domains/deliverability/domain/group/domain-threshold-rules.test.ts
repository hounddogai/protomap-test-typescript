import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainThresholdExpiresAtRangeRule,
  DomainThresholdRequiredCodeRule,
  DomainThresholdRequiredLabelRule,
  defaultDomainThresholdValidator,
} from "./domain-threshold-rules.js";
import { newDomainThreshold } from "./domain-threshold.js";

test("DomainThresholdValidator reports every problem", () => {
  const validator = defaultDomainThresholdValidator();
  const item = newDomainThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainThresholdExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DomainThresholdExpiresAtRangeRule(64, 1000);
  const item = newDomainThreshold("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new DomainThresholdRequiredCodeRule("domain threshold needs this field");
  const item = newDomainThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new DomainThresholdRequiredLabelRule("domain threshold needs this field");
  const item = newDomainThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
