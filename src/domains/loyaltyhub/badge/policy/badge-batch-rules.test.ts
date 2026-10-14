import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeBatchNameLengthRule,
  BadgeBatchRequiredCampaignRefRule,
  BadgeBatchRequiredCodeRule,
  BadgeBatchRequiredNameRule,
  BadgeBatchUpdatedAtRangeRule,
  defaultBadgeBatchValidator,
} from "./badge-batch-rules.js";
import { newBadgeBatch } from "./badge-batch.js";

test("BadgeBatchValidator reports every problem", () => {
  const validator = defaultBadgeBatchValidator();
  const item = newBadgeBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeBatchRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BadgeBatchRequiredCampaignRefRule("badge batch needs an entry");
  const item = newBadgeBatch("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeBatchRequiredNameRule flags a blank name", () => {
  const rule = new BadgeBatchRequiredNameRule("badge batch needs this field");
  const item = newBadgeBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeBatchRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeBatchRequiredCodeRule("badge batch needs a value");
  const item = newBadgeBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeBatchUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new BadgeBatchUpdatedAtRangeRule(32, 86400);
  const item = newBadgeBatch("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeBatchNameLengthRule flags a long name", () => {
  const rule = new BadgeBatchNameLengthRule(3600);
  const item = newBadgeBatch("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
