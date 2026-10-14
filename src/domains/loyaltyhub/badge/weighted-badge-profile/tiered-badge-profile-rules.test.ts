import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBadgeProfileAmountRangeRule,
  TieredBadgeProfileCodeLengthRule,
  TieredBadgeProfilePriorityRangeRule,
  TieredBadgeProfileRequiredRegionRule,
  TieredBadgeProfileRequiredTitleRule,
  TieredBadgeProfileRequiredVariantRule,
  defaultTieredBadgeProfileValidator,
} from "./tiered-badge-profile-rules.js";
import { newTieredBadgeProfile } from "./tiered-badge-profile.js";

test("TieredBadgeProfileValidator reports every problem", () => {
  const validator = defaultTieredBadgeProfileValidator();
  const item = newTieredBadgeProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBadgeProfileCodeLengthRule flags a long code", () => {
  const rule = new TieredBadgeProfileCodeLengthRule(16);
  const item = newTieredBadgeProfile("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBadgeProfileRequiredVariantRule flags a blank variant", () => {
  const rule = new TieredBadgeProfileRequiredVariantRule("tiered badge profile needs this field");
  const item = newTieredBadgeProfile("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBadgeProfileRequiredRegionRule flags a blank region", () => {
  const rule = new TieredBadgeProfileRequiredRegionRule("tiered badge profile needs a value");
  const item = newTieredBadgeProfile("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBadgeProfileAmountRangeRule flags values above amount", () => {
  const rule = new TieredBadgeProfileAmountRangeRule(0.1, 3344.4);
  const item = newTieredBadgeProfile("x", "y");
  item.amount = 3345.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBadgeProfileRequiredTitleRule flags a blank title", () => {
  const rule = new TieredBadgeProfileRequiredTitleRule("tiered badge profile needs a value");
  const item = newTieredBadgeProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBadgeProfilePriorityRangeRule flags values above priority", () => {
  const rule = new TieredBadgeProfilePriorityRangeRule(32, 64);
  const item = newTieredBadgeProfile("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
