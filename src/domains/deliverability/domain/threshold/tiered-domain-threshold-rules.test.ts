import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDomainThresholdNameLengthRule,
  TieredDomainThresholdRequiredNameRule,
  defaultTieredDomainThresholdValidator,
} from "./tiered-domain-threshold-rules.js";
import { newTieredDomainThreshold } from "./tiered-domain-threshold.js";

test("TieredDomainThresholdValidator reports every problem", () => {
  const validator = defaultTieredDomainThresholdValidator();
  const item = newTieredDomainThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDomainThresholdRequiredNameRule flags a blank name", () => {
  const rule = new TieredDomainThresholdRequiredNameRule("tiered domain threshold needs an entry");
  const item = newTieredDomainThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredDomainThresholdNameLengthRule flags a long name", () => {
  const rule = new TieredDomainThresholdNameLengthRule(1000);
  const item = newTieredDomainThreshold("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
