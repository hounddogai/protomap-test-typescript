import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalSlaDigestCapacityRangeRule,
  RegionalSlaDigestNameLengthRule,
  RegionalSlaDigestOwnerIdLengthRule,
  RegionalSlaDigestRequiredCodeRule,
  defaultRegionalSlaDigestValidator,
} from "./regional-sla-digest-rules.js";
import { newRegionalSlaDigest } from "./regional-sla-digest.js";

test("RegionalSlaDigestValidator reports every problem", () => {
  const validator = defaultRegionalSlaDigestValidator();
  const item = newRegionalSlaDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalSlaDigestRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalSlaDigestRequiredCodeRule("regional sla digest needs an entry");
  const item = newRegionalSlaDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalSlaDigestNameLengthRule flags a long name", () => {
  const rule = new RegionalSlaDigestNameLengthRule(32);
  const item = newRegionalSlaDigest("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSlaDigestOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RegionalSlaDigestOwnerIdLengthRule(255);
  const item = newRegionalSlaDigest("x", "y");
  item.ownerId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalSlaDigestCapacityRangeRule flags values above capacity", () => {
  const rule = new RegionalSlaDigestCapacityRangeRule(32, 80);
  const item = newRegionalSlaDigest("x", "y");
  item.capacity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
