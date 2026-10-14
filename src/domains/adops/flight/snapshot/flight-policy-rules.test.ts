import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightPolicyRequiredChannelRule,
  FlightPolicyRequiredCodeRule,
  FlightPolicyRequiredTitleRule,
  FlightPolicyThresholdRangeRule,
  defaultFlightPolicyValidator,
} from "./flight-policy-rules.js";
import { newFlightPolicy } from "./flight-policy.js";

test("FlightPolicyValidator reports every problem", () => {
  const validator = defaultFlightPolicyValidator();
  const item = newFlightPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightPolicyThresholdRangeRule flags values above threshold", () => {
  const rule = new FlightPolicyThresholdRangeRule(9.7, 4161.5);
  const item = newFlightPolicy("x", "y");
  item.threshold = 4163;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightPolicyRequiredChannelRule flags a blank channel", () => {
  const rule = new FlightPolicyRequiredChannelRule("flight policy needs this field");
  const item = newFlightPolicy("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightPolicyRequiredTitleRule flags a blank title", () => {
  const rule = new FlightPolicyRequiredTitleRule("flight policy needs an entry");
  const item = newFlightPolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new FlightPolicyRequiredCodeRule("flight policy needs a value");
  const item = newFlightPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
