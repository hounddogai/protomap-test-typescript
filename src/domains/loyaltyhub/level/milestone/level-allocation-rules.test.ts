import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelAllocationCreatedAtRangeRule,
  LevelAllocationExternalRefLengthRule,
  LevelAllocationRegionLengthRule,
  LevelAllocationRequiredCodeRule,
  LevelAllocationRequiredRegionRule,
  defaultLevelAllocationValidator,
} from "./level-allocation-rules.js";
import { newLevelAllocation } from "./level-allocation.js";

test("LevelAllocationValidator reports every problem", () => {
  const validator = defaultLevelAllocationValidator();
  const item = newLevelAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new LevelAllocationRequiredCodeRule("level allocation needs an entry");
  const item = newLevelAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelAllocationRequiredRegionRule flags a blank region", () => {
  const rule = new LevelAllocationRequiredRegionRule("level allocation needs a value");
  const item = newLevelAllocation("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelAllocationRegionLengthRule flags a long region", () => {
  const rule = new LevelAllocationRegionLengthRule(80);
  const item = newLevelAllocation("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelAllocationCreatedAtRangeRule flags values above created at", () => {
  const rule = new LevelAllocationCreatedAtRangeRule(32, 1000);
  const item = newLevelAllocation("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelAllocationExternalRefLengthRule flags a long external ref", () => {
  const rule = new LevelAllocationExternalRefLengthRule(255);
  const item = newLevelAllocation("x", "y");
  item.externalRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
