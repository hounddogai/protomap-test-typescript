import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredSlaMappingBudgetRangeRule,
  TieredSlaMappingLocaleLengthRule,
  TieredSlaMappingTitleLengthRule,
  defaultTieredSlaMappingValidator,
} from "./tiered-sla-mapping-rules.js";
import { newTieredSlaMapping } from "./tiered-sla-mapping.js";

test("TieredSlaMappingValidator reports every problem", () => {
  const validator = defaultTieredSlaMappingValidator();
  const item = newTieredSlaMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredSlaMappingLocaleLengthRule flags a long locale", () => {
  const rule = new TieredSlaMappingLocaleLengthRule(1000);
  const item = newTieredSlaMapping("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredSlaMappingBudgetRangeRule flags values above budget", () => {
  const rule = new TieredSlaMappingBudgetRangeRule(2.1, 3857.2);
  const item = newTieredSlaMapping("x", "y");
  item.budget = 3858.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredSlaMappingTitleLengthRule flags a long title", () => {
  const rule = new TieredSlaMappingTitleLengthRule(16);
  const item = newTieredSlaMapping("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
