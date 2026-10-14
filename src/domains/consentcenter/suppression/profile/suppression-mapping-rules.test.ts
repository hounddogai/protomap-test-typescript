import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionMappingChannelLengthRule,
  SuppressionMappingCodeLengthRule,
  SuppressionMappingCostRangeRule,
  SuppressionMappingRequiredChannelRule,
  defaultSuppressionMappingValidator,
} from "./suppression-mapping-rules.js";
import { newSuppressionMapping } from "./suppression-mapping.js";

test("SuppressionMappingValidator reports every problem", () => {
  const validator = defaultSuppressionMappingValidator();
  const item = newSuppressionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionMappingCostRangeRule flags values above cost", () => {
  const rule = new SuppressionMappingCostRangeRule(9.6, 1076.6);
  const item = newSuppressionMapping("x", "y");
  item.cost = 1078.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionMappingRequiredChannelRule flags a blank channel", () => {
  const rule = new SuppressionMappingRequiredChannelRule("suppression mapping needs a value");
  const item = newSuppressionMapping("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionMappingCodeLengthRule flags a long code", () => {
  const rule = new SuppressionMappingCodeLengthRule(64);
  const item = newSuppressionMapping("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SuppressionMappingChannelLengthRule flags a long channel", () => {
  const rule = new SuppressionMappingChannelLengthRule(86400);
  const item = newSuppressionMapping("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
