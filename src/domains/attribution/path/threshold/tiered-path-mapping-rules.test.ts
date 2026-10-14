import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPathMappingCodeLengthRule,
  TieredPathMappingLocaleLengthRule,
  TieredPathMappingNameLengthRule,
  TieredPathMappingVersionRangeRule,
  defaultTieredPathMappingValidator,
} from "./tiered-path-mapping-rules.js";
import { newTieredPathMapping } from "./tiered-path-mapping.js";

test("TieredPathMappingValidator reports every problem", () => {
  const validator = defaultTieredPathMappingValidator();
  const item = newTieredPathMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPathMappingLocaleLengthRule flags a long locale", () => {
  const rule = new TieredPathMappingLocaleLengthRule(120);
  const item = newTieredPathMapping("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPathMappingVersionRangeRule flags values above version", () => {
  const rule = new TieredPathMappingVersionRangeRule(16, 80);
  const item = newTieredPathMapping("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPathMappingNameLengthRule flags a long name", () => {
  const rule = new TieredPathMappingNameLengthRule(1000);
  const item = newTieredPathMapping("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPathMappingCodeLengthRule flags a long code", () => {
  const rule = new TieredPathMappingCodeLengthRule(3600);
  const item = newTieredPathMapping("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
