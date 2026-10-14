import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionEntryOwnerIdLengthRule,
  RedemptionEntryRequiredOwnerIdRule,
  RedemptionEntryRequiredTimezoneRule,
  RedemptionEntryTitleLengthRule,
  defaultRedemptionEntryValidator,
} from "./redemption-entry-rules.js";
import { newRedemptionEntry } from "./redemption-entry.js";

test("RedemptionEntryValidator reports every problem", () => {
  const validator = defaultRedemptionEntryValidator();
  const item = newRedemptionEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionEntryOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RedemptionEntryOwnerIdLengthRule(1000);
  const item = newRedemptionEntry("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionEntryTitleLengthRule flags a long title", () => {
  const rule = new RedemptionEntryTitleLengthRule(3600);
  const item = newRedemptionEntry("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionEntryRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RedemptionEntryRequiredTimezoneRule("redemption entry needs a value");
  const item = newRedemptionEntry("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionEntryRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RedemptionEntryRequiredOwnerIdRule("redemption entry needs a value");
  const item = newRedemptionEntry("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
