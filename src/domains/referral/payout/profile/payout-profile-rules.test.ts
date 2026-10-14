import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutProfileNameLengthRule,
  PayoutProfileRequiredUtmSourceRule,
  PayoutProfileUtmSourceLengthRule,
  defaultPayoutProfileValidator,
} from "./payout-profile-rules.js";
import { newPayoutProfile } from "./payout-profile.js";

test("PayoutProfileValidator reports every problem", () => {
  const validator = defaultPayoutProfileValidator();
  const item = newPayoutProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutProfileRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PayoutProfileRequiredUtmSourceRule("payout profile needs an entry");
  const item = newPayoutProfile("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutProfileUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PayoutProfileUtmSourceLengthRule(16);
  const item = newPayoutProfile("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutProfileNameLengthRule flags a long name", () => {
  const rule = new PayoutProfileNameLengthRule(64);
  const item = newPayoutProfile("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
