import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedSlaMappingAudienceIdLengthRule,
  WeightedSlaMappingCodeLengthRule,
  defaultWeightedSlaMappingValidator,
} from "./weighted-sla-mapping-rules.js";
import { newWeightedSlaMapping } from "./weighted-sla-mapping.js";

test("WeightedSlaMappingValidator reports every problem", () => {
  const validator = defaultWeightedSlaMappingValidator();
  const item = newWeightedSlaMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedSlaMappingAudienceIdLengthRule flags a long audience id", () => {
  const rule = new WeightedSlaMappingAudienceIdLengthRule(86400);
  const item = newWeightedSlaMapping("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedSlaMappingCodeLengthRule flags a long code", () => {
  const rule = new WeightedSlaMappingCodeLengthRule(32);
  const item = newWeightedSlaMapping("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
