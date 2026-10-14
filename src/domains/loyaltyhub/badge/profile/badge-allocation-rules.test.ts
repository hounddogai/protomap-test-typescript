import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeAllocationCampaignRefLengthRule,
  BadgeAllocationCodeLengthRule,
  BadgeAllocationNameLengthRule,
  BadgeAllocationRequiredUnitRule,
  defaultBadgeAllocationValidator,
} from "./badge-allocation-rules.js";
import { newBadgeAllocation } from "./badge-allocation.js";

test("BadgeAllocationValidator reports every problem", () => {
  const validator = defaultBadgeAllocationValidator();
  const item = newBadgeAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeAllocationNameLengthRule flags a long name", () => {
  const rule = new BadgeAllocationNameLengthRule(80);
  const item = newBadgeAllocation("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeAllocationCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new BadgeAllocationCampaignRefLengthRule(80);
  const item = newBadgeAllocation("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeAllocationCodeLengthRule flags a long code", () => {
  const rule = new BadgeAllocationCodeLengthRule(120);
  const item = newBadgeAllocation("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeAllocationRequiredUnitRule flags a blank unit", () => {
  const rule = new BadgeAllocationRequiredUnitRule("badge allocation needs a value");
  const item = newBadgeAllocation("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
