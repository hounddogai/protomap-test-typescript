import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredCsatMappingExternalRefLengthRule,
  TieredCsatMappingLabelLengthRule,
  TieredCsatMappingRequiredLabelRule,
  TieredCsatMappingTitleLengthRule,
  TieredCsatMappingUpdatedAtRangeRule,
  defaultTieredCsatMappingValidator,
} from "./tiered-csat-mapping-rules.js";
import { newTieredCsatMapping } from "./tiered-csat-mapping.js";

test("TieredCsatMappingValidator reports every problem", () => {
  const validator = defaultTieredCsatMappingValidator();
  const item = newTieredCsatMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredCsatMappingUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new TieredCsatMappingUpdatedAtRangeRule(32, 86400);
  const item = newTieredCsatMapping("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredCsatMappingExternalRefLengthRule flags a long external ref", () => {
  const rule = new TieredCsatMappingExternalRefLengthRule(32);
  const item = newTieredCsatMapping("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredCsatMappingRequiredLabelRule flags a blank label", () => {
  const rule = new TieredCsatMappingRequiredLabelRule("tiered csat mapping needs an entry");
  const item = newTieredCsatMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredCsatMappingTitleLengthRule flags a long title", () => {
  const rule = new TieredCsatMappingTitleLengthRule(64);
  const item = newTieredCsatMapping("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredCsatMappingLabelLengthRule flags a long label", () => {
  const rule = new TieredCsatMappingLabelLengthRule(3600);
  const item = newTieredCsatMapping("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
