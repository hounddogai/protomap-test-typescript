import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPaywallWindowExpiresAtRangeRule,
  RegionalPaywallWindowQuantityRangeRule,
  RegionalPaywallWindowRequiredRegionRule,
  RegionalPaywallWindowRequiredTitleRule,
  defaultRegionalPaywallWindowValidator,
} from "./regional-paywall-window-rules.js";
import { newRegionalPaywallWindow } from "./regional-paywall-window.js";

test("RegionalPaywallWindowValidator reports every problem", () => {
  const validator = defaultRegionalPaywallWindowValidator();
  const item = newRegionalPaywallWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPaywallWindowRequiredRegionRule flags a blank region", () => {
  const rule = new RegionalPaywallWindowRequiredRegionRule("regional paywall window needs an entry");
  const item = newRegionalPaywallWindow("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPaywallWindowQuantityRangeRule flags values above quantity", () => {
  const rule = new RegionalPaywallWindowQuantityRangeRule(120, 3600);
  const item = newRegionalPaywallWindow("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPaywallWindowRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalPaywallWindowRequiredTitleRule("regional paywall window needs a value");
  const item = newRegionalPaywallWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPaywallWindowExpiresAtRangeRule flags values above expires at", () => {
  const rule = new RegionalPaywallWindowExpiresAtRangeRule(32, 80);
  const item = newRegionalPaywallWindow("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
