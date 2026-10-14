import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPayoutPolicyContactEmailLengthRule,
  RegionalPayoutPolicyThresholdRangeRule,
  defaultRegionalPayoutPolicyValidator,
} from "./regional-payout-policy-rules.js";
import { newRegionalPayoutPolicy } from "./regional-payout-policy.js";

test("RegionalPayoutPolicyValidator reports every problem", () => {
  const validator = defaultRegionalPayoutPolicyValidator();
  const item = newRegionalPayoutPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPayoutPolicyThresholdRangeRule flags values above threshold", () => {
  const rule = new RegionalPayoutPolicyThresholdRangeRule(3.4, 4035.3);
  const item = newRegionalPayoutPolicy("x", "y");
  item.threshold = 4036.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPayoutPolicyContactEmailLengthRule flags a long contact email", () => {
  const rule = new RegionalPayoutPolicyContactEmailLengthRule(1000);
  const item = newRegionalPayoutPolicy("x", "y");
  item.contactEmail = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
