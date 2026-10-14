import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDomainScoreCostRangeRule,
  ScheduledDomainScoreLabelLengthRule,
  ScheduledDomainScoreMarginRangeRule,
  ScheduledDomainScoreOwnerIdLengthRule,
  ScheduledDomainScoreRequiredOwnerIdRule,
  defaultScheduledDomainScoreValidator,
} from "./scheduled-domain-score-rules.js";
import { newScheduledDomainScore } from "./scheduled-domain-score.js";

test("ScheduledDomainScoreValidator reports every problem", () => {
  const validator = defaultScheduledDomainScoreValidator();
  const item = newScheduledDomainScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDomainScoreOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ScheduledDomainScoreOwnerIdLengthRule(16);
  const item = newScheduledDomainScore("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDomainScoreMarginRangeRule flags values above margin", () => {
  const rule = new ScheduledDomainScoreMarginRangeRule(5.8, 618.3);
  const item = newScheduledDomainScore("x", "y");
  item.margin = 619.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDomainScoreRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ScheduledDomainScoreRequiredOwnerIdRule("scheduled domain score needs an entry");
  const item = newScheduledDomainScore("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDomainScoreCostRangeRule flags values above cost", () => {
  const rule = new ScheduledDomainScoreCostRangeRule(4.8, 3692.4);
  const item = newScheduledDomainScore("x", "y");
  item.cost = 3693.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDomainScoreLabelLengthRule flags a long label", () => {
  const rule = new ScheduledDomainScoreLabelLengthRule(255);
  const item = newScheduledDomainScore("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
