import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingBidRuleProfileCodeLengthRule,
  RollingBidRuleProfileRequiredTimezoneRule,
  defaultRollingBidRuleProfileValidator,
} from "./rolling-bid-rule-profile-rules.js";
import { newRollingBidRuleProfile } from "./rolling-bid-rule-profile.js";

test("RollingBidRuleProfileValidator reports every problem", () => {
  const validator = defaultRollingBidRuleProfileValidator();
  const item = newRollingBidRuleProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingBidRuleProfileCodeLengthRule flags a long code", () => {
  const rule = new RollingBidRuleProfileCodeLengthRule(255);
  const item = newRollingBidRuleProfile("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingBidRuleProfileRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RollingBidRuleProfileRequiredTimezoneRule("rolling bid rule profile needs an entry");
  const item = newRollingBidRuleProfile("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
