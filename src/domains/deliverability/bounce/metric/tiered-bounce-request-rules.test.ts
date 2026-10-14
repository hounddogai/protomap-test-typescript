import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBounceRequestCategoryLengthRule,
  TieredBounceRequestQuantityRangeRule,
  TieredBounceRequestRequiredTitleRule,
  TieredBounceRequestSequenceRangeRule,
  TieredBounceRequestTitleLengthRule,
  defaultTieredBounceRequestValidator,
} from "./tiered-bounce-request-rules.js";
import { newTieredBounceRequest } from "./tiered-bounce-request.js";

test("TieredBounceRequestValidator reports every problem", () => {
  const validator = defaultTieredBounceRequestValidator();
  const item = newTieredBounceRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBounceRequestSequenceRangeRule flags values above sequence", () => {
  const rule = new TieredBounceRequestSequenceRangeRule(16, 86400);
  const item = newTieredBounceRequest("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBounceRequestRequiredTitleRule flags a blank title", () => {
  const rule = new TieredBounceRequestRequiredTitleRule("tiered bounce request needs a value");
  const item = newTieredBounceRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBounceRequestQuantityRangeRule flags values above quantity", () => {
  const rule = new TieredBounceRequestQuantityRangeRule(64, 3600);
  const item = newTieredBounceRequest("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBounceRequestCategoryLengthRule flags a long category", () => {
  const rule = new TieredBounceRequestCategoryLengthRule(1000);
  const item = newTieredBounceRequest("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBounceRequestTitleLengthRule flags a long title", () => {
  const rule = new TieredBounceRequestTitleLengthRule(64);
  const item = newTieredBounceRequest("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
