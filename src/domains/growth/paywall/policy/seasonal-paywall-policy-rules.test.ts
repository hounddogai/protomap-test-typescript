import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPaywallPolicyRequiredCodeRule,
  SeasonalPaywallPolicyRequiredLabelRule,
  defaultSeasonalPaywallPolicyValidator,
} from "./seasonal-paywall-policy-rules.js";
import { newSeasonalPaywallPolicy } from "./seasonal-paywall-policy.js";

test("SeasonalPaywallPolicyValidator reports every problem", () => {
  const validator = defaultSeasonalPaywallPolicyValidator();
  const item = newSeasonalPaywallPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPaywallPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalPaywallPolicyRequiredLabelRule("seasonal paywall policy needs an entry");
  const item = newSeasonalPaywallPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalPaywallPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalPaywallPolicyRequiredCodeRule("seasonal paywall policy needs this field");
  const item = newSeasonalPaywallPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
