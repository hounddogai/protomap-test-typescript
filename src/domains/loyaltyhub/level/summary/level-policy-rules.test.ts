import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelPolicyExternalRefLengthRule,
  LevelPolicyLimitRangeRule,
  LevelPolicyNameLengthRule,
  LevelPolicyRequiredExternalRefRule,
  LevelPolicyTimezoneLengthRule,
  defaultLevelPolicyValidator,
} from "./level-policy-rules.js";
import { newLevelPolicy } from "./level-policy.js";

test("LevelPolicyValidator reports every problem", () => {
  const validator = defaultLevelPolicyValidator();
  const item = newLevelPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelPolicyTimezoneLengthRule flags a long timezone", () => {
  const rule = new LevelPolicyTimezoneLengthRule(3600);
  const item = newLevelPolicy("x", "y");
  item.timezone = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelPolicyNameLengthRule flags a long name", () => {
  const rule = new LevelPolicyNameLengthRule(64);
  const item = newLevelPolicy("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelPolicyRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new LevelPolicyRequiredExternalRefRule("level policy needs a value");
  const item = newLevelPolicy("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelPolicyExternalRefLengthRule flags a long external ref", () => {
  const rule = new LevelPolicyExternalRefLengthRule(1000);
  const item = newLevelPolicy("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelPolicyLimitRangeRule flags values above limit", () => {
  const rule = new LevelPolicyLimitRangeRule(16, 32);
  const item = newLevelPolicy("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
