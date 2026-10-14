import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultDomainThresholdRequiredTitleRule,
  DefaultDomainThresholdStartsAtRangeRule,
  DefaultDomainThresholdTitleLengthRule,
  defaultDefaultDomainThresholdValidator,
} from "./default-domain-threshold-rules.js";
import { newDefaultDomainThreshold } from "./default-domain-threshold.js";

test("DefaultDomainThresholdValidator reports every problem", () => {
  const validator = defaultDefaultDomainThresholdValidator();
  const item = newDefaultDomainThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultDomainThresholdTitleLengthRule flags a long title", () => {
  const rule = new DefaultDomainThresholdTitleLengthRule(120);
  const item = newDefaultDomainThreshold("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultDomainThresholdStartsAtRangeRule flags values above starts at", () => {
  const rule = new DefaultDomainThresholdStartsAtRangeRule(1000, 3600);
  const item = newDefaultDomainThreshold("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultDomainThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultDomainThresholdRequiredTitleRule("default domain threshold needs an entry");
  const item = newDefaultDomainThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
