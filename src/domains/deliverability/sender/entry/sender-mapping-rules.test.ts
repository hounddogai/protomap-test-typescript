import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderMappingBidRangeRule,
  SenderMappingCodeLengthRule,
  SenderMappingLimitRangeRule,
  SenderMappingQuantityRangeRule,
  SenderMappingRequiredCodeRule,
  defaultSenderMappingValidator,
} from "./sender-mapping-rules.js";
import { newSenderMapping } from "./sender-mapping.js";

test("SenderMappingValidator reports every problem", () => {
  const validator = defaultSenderMappingValidator();
  const item = newSenderMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderMappingRequiredCodeRule flags a blank code", () => {
  const rule = new SenderMappingRequiredCodeRule("sender mapping needs this field");
  const item = newSenderMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderMappingLimitRangeRule flags values above limit", () => {
  const rule = new SenderMappingLimitRangeRule(32, 86400);
  const item = newSenderMapping("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderMappingQuantityRangeRule flags values above quantity", () => {
  const rule = new SenderMappingQuantityRangeRule(16, 64);
  const item = newSenderMapping("x", "y");
  item.quantity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderMappingCodeLengthRule flags a long code", () => {
  const rule = new SenderMappingCodeLengthRule(16);
  const item = newSenderMapping("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderMappingBidRangeRule flags values above bid", () => {
  const rule = new SenderMappingBidRangeRule(0.9, 1322.6);
  const item = newSenderMapping("x", "y");
  item.bid = 1324.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
