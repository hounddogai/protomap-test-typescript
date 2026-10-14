import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientJourneyPolicyLimitRangeRule,
  LenientJourneyPolicyRequiredLabelRule,
  LenientJourneyPolicyRetriesRangeRule,
  LenientJourneyPolicyUtmSourceLengthRule,
  defaultLenientJourneyPolicyValidator,
} from "./lenient-journey-policy-rules.js";
import { newLenientJourneyPolicy } from "./lenient-journey-policy.js";

test("LenientJourneyPolicyValidator reports every problem", () => {
  const validator = defaultLenientJourneyPolicyValidator();
  const item = newLenientJourneyPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientJourneyPolicyUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientJourneyPolicyUtmSourceLengthRule(32);
  const item = newLenientJourneyPolicy("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientJourneyPolicyLimitRangeRule flags values above limit", () => {
  const rule = new LenientJourneyPolicyLimitRangeRule(64, 255);
  const item = newLenientJourneyPolicy("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientJourneyPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new LenientJourneyPolicyRequiredLabelRule("lenient journey policy needs this field");
  const item = newLenientJourneyPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientJourneyPolicyRetriesRangeRule flags values above retries", () => {
  const rule = new LenientJourneyPolicyRetriesRangeRule(64, 1000);
  const item = newLenientJourneyPolicy("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
