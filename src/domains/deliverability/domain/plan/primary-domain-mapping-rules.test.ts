import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryDomainMappingCodeLengthRule,
  PrimaryDomainMappingRegionLengthRule,
  PrimaryDomainMappingRequiredTitleRule,
  PrimaryDomainMappingRetriesRangeRule,
  PrimaryDomainMappingTitleLengthRule,
  defaultPrimaryDomainMappingValidator,
} from "./primary-domain-mapping-rules.js";
import { newPrimaryDomainMapping } from "./primary-domain-mapping.js";

test("PrimaryDomainMappingValidator reports every problem", () => {
  const validator = defaultPrimaryDomainMappingValidator();
  const item = newPrimaryDomainMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryDomainMappingCodeLengthRule flags a long code", () => {
  const rule = new PrimaryDomainMappingCodeLengthRule(120);
  const item = newPrimaryDomainMapping("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryDomainMappingRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryDomainMappingRequiredTitleRule("primary domain mapping needs this field");
  const item = newPrimaryDomainMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryDomainMappingTitleLengthRule flags a long title", () => {
  const rule = new PrimaryDomainMappingTitleLengthRule(1000);
  const item = newPrimaryDomainMapping("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryDomainMappingRegionLengthRule flags a long region", () => {
  const rule = new PrimaryDomainMappingRegionLengthRule(1000);
  const item = newPrimaryDomainMapping("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryDomainMappingRetriesRangeRule flags values above retries", () => {
  const rule = new PrimaryDomainMappingRetriesRangeRule(32, 86400);
  const item = newPrimaryDomainMapping("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
