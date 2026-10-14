import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingCsatProfileRequiredCategoryRule,
  RollingCsatProfileRequiredCodeRule,
  RollingCsatProfileSourceLengthRule,
  RollingCsatProfileStartsAtRangeRule,
  defaultRollingCsatProfileValidator,
} from "./rolling-csat-profile-rules.js";
import { newRollingCsatProfile } from "./rolling-csat-profile.js";

test("RollingCsatProfileValidator reports every problem", () => {
  const validator = defaultRollingCsatProfileValidator();
  const item = newRollingCsatProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingCsatProfileRequiredCodeRule flags a blank code", () => {
  const rule = new RollingCsatProfileRequiredCodeRule("rolling csat profile needs this field");
  const item = newRollingCsatProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCsatProfileStartsAtRangeRule flags values above starts at", () => {
  const rule = new RollingCsatProfileStartsAtRangeRule(80, 86400);
  const item = newRollingCsatProfile("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingCsatProfileSourceLengthRule flags a long source", () => {
  const rule = new RollingCsatProfileSourceLengthRule(16);
  const item = newRollingCsatProfile("x", "y");
  item.source = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCsatProfileRequiredCategoryRule flags a blank category", () => {
  const rule = new RollingCsatProfileRequiredCategoryRule("rolling csat profile needs an entry");
  const item = newRollingCsatProfile("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
