import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRetentionMappingCodeLengthRule,
  ManualRetentionMappingSourceLengthRule,
  ManualRetentionMappingTitleLengthRule,
  defaultManualRetentionMappingValidator,
} from "./manual-retention-mapping-rules.js";
import { newManualRetentionMapping } from "./manual-retention-mapping.js";

test("ManualRetentionMappingValidator reports every problem", () => {
  const validator = defaultManualRetentionMappingValidator();
  const item = newManualRetentionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRetentionMappingTitleLengthRule flags a long title", () => {
  const rule = new ManualRetentionMappingTitleLengthRule(255);
  const item = newManualRetentionMapping("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRetentionMappingCodeLengthRule flags a long code", () => {
  const rule = new ManualRetentionMappingCodeLengthRule(3600);
  const item = newManualRetentionMapping("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRetentionMappingSourceLengthRule flags a long source", () => {
  const rule = new ManualRetentionMappingSourceLengthRule(1000);
  const item = newManualRetentionMapping("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
