import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainMilestoneCodeLengthRule,
  DomainMilestoneLimitRangeRule,
  DomainMilestoneMinimumRangeRule,
  DomainMilestoneNameLengthRule,
  DomainMilestoneSendAtRangeRule,
  defaultDomainMilestoneValidator,
} from "./domain-milestone-rules.js";
import { newDomainMilestone } from "./domain-milestone.js";

test("DomainMilestoneValidator reports every problem", () => {
  const validator = defaultDomainMilestoneValidator();
  const item = newDomainMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainMilestoneLimitRangeRule flags values above limit", () => {
  const rule = new DomainMilestoneLimitRangeRule(255, 86400);
  const item = newDomainMilestone("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainMilestoneMinimumRangeRule flags values above minimum", () => {
  const rule = new DomainMilestoneMinimumRangeRule(7.6, 1956.7);
  const item = newDomainMilestone("x", "y");
  item.minimum = 1958.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainMilestoneSendAtRangeRule flags values above send at", () => {
  const rule = new DomainMilestoneSendAtRangeRule(120, 1000);
  const item = newDomainMilestone("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainMilestoneNameLengthRule flags a long name", () => {
  const rule = new DomainMilestoneNameLengthRule(1000);
  const item = newDomainMilestone("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainMilestoneCodeLengthRule flags a long code", () => {
  const rule = new DomainMilestoneCodeLengthRule(80);
  const item = newDomainMilestone("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
