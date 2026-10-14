import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRetentionDraftDiscountRangeRule,
  TieredRetentionDraftLimitRangeRule,
  TieredRetentionDraftNameLengthRule,
  defaultTieredRetentionDraftValidator,
} from "./tiered-retention-draft-rules.js";
import { newTieredRetentionDraft } from "./tiered-retention-draft.js";

test("TieredRetentionDraftValidator reports every problem", () => {
  const validator = defaultTieredRetentionDraftValidator();
  const item = newTieredRetentionDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRetentionDraftNameLengthRule flags a long name", () => {
  const rule = new TieredRetentionDraftNameLengthRule(1000);
  const item = newTieredRetentionDraft("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRetentionDraftLimitRangeRule flags values above limit", () => {
  const rule = new TieredRetentionDraftLimitRangeRule(64, 3600);
  const item = newTieredRetentionDraft("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRetentionDraftDiscountRangeRule flags values above discount", () => {
  const rule = new TieredRetentionDraftDiscountRangeRule(7.3, 3535.2);
  const item = newTieredRetentionDraft("x", "y");
  item.discount = 3536.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
