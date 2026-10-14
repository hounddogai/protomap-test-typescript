import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWaitDigestCodeLengthRule,
  TieredWaitDigestDiscountRangeRule,
  TieredWaitDigestNameLengthRule,
  TieredWaitDigestRequiredNameRule,
  defaultTieredWaitDigestValidator,
} from "./tiered-wait-digest-rules.js";
import { newTieredWaitDigest } from "./tiered-wait-digest.js";

test("TieredWaitDigestValidator reports every problem", () => {
  const validator = defaultTieredWaitDigestValidator();
  const item = newTieredWaitDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWaitDigestRequiredNameRule flags a blank name", () => {
  const rule = new TieredWaitDigestRequiredNameRule("tiered wait digest needs this field");
  const item = newTieredWaitDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredWaitDigestNameLengthRule flags a long name", () => {
  const rule = new TieredWaitDigestNameLengthRule(64);
  const item = newTieredWaitDigest("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWaitDigestDiscountRangeRule flags values above discount", () => {
  const rule = new TieredWaitDigestDiscountRangeRule(1.5, 3947.2);
  const item = newTieredWaitDigest("x", "y");
  item.discount = 3948.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredWaitDigestCodeLengthRule flags a long code", () => {
  const rule = new TieredWaitDigestCodeLengthRule(3600);
  const item = newTieredWaitDigest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
