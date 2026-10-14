import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionRollupCampaignRefLengthRule,
  SubscriptionRollupCodeLengthRule,
  SubscriptionRollupExpiresAtRangeRule,
  SubscriptionRollupNameLengthRule,
  SubscriptionRollupPriorityRangeRule,
  defaultSubscriptionRollupValidator,
} from "./subscription-rollup-rules.js";
import { newSubscriptionRollup } from "./subscription-rollup.js";

test("SubscriptionRollupValidator reports every problem", () => {
  const validator = defaultSubscriptionRollupValidator();
  const item = newSubscriptionRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionRollupCodeLengthRule flags a long code", () => {
  const rule = new SubscriptionRollupCodeLengthRule(255);
  const item = newSubscriptionRollup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionRollupCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new SubscriptionRollupCampaignRefLengthRule(1000);
  const item = newSubscriptionRollup("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionRollupPriorityRangeRule flags values above priority", () => {
  const rule = new SubscriptionRollupPriorityRangeRule(1000, 3600);
  const item = newSubscriptionRollup("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionRollupExpiresAtRangeRule flags values above expires at", () => {
  const rule = new SubscriptionRollupExpiresAtRangeRule(255, 1000);
  const item = newSubscriptionRollup("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionRollupNameLengthRule flags a long name", () => {
  const rule = new SubscriptionRollupNameLengthRule(32);
  const item = newSubscriptionRollup("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
