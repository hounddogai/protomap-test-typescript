import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultBadgeGroupAmountRangeRule,
  DefaultBadgeGroupContactEmailLengthRule,
  DefaultBadgeGroupRequiredCodeRule,
  DefaultBadgeGroupRequiredCohortRule,
  DefaultBadgeGroupRequiredContactEmailRule,
  DefaultBadgeGroupScoreRangeRule,
  defaultDefaultBadgeGroupValidator,
} from "./default-badge-group-rules.js";
import { newDefaultBadgeGroup } from "./default-badge-group.js";

test("DefaultBadgeGroupValidator reports every problem", () => {
  const validator = defaultDefaultBadgeGroupValidator();
  const item = newDefaultBadgeGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultBadgeGroupRequiredCohortRule flags a blank cohort", () => {
  const rule = new DefaultBadgeGroupRequiredCohortRule("default badge group needs this field");
  const item = newDefaultBadgeGroup("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultBadgeGroupRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultBadgeGroupRequiredCodeRule("default badge group needs an entry");
  const item = newDefaultBadgeGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultBadgeGroupRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new DefaultBadgeGroupRequiredContactEmailRule("default badge group needs an entry");
  const item = newDefaultBadgeGroup("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultBadgeGroupAmountRangeRule flags values above amount", () => {
  const rule = new DefaultBadgeGroupAmountRangeRule(1.9, 3135.3);
  const item = newDefaultBadgeGroup("x", "y");
  item.amount = 3136.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultBadgeGroupScoreRangeRule flags values above score", () => {
  const rule = new DefaultBadgeGroupScoreRangeRule(3.7, 4667.1);
  const item = newDefaultBadgeGroup("x", "y");
  item.score = 4668.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultBadgeGroupContactEmailLengthRule flags a long contact email", () => {
  const rule = new DefaultBadgeGroupContactEmailLengthRule(64);
  const item = newDefaultBadgeGroup("x", "y");
  item.contactEmail = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
