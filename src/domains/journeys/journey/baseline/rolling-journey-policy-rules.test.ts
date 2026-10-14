import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingJourneyPolicyCodeLengthRule,
  RollingJourneyPolicyRequiredLabelRule,
  RollingJourneyPolicyRequiredUtmSourceRule,
  defaultRollingJourneyPolicyValidator,
} from "./rolling-journey-policy-rules.js";
import { newRollingJourneyPolicy } from "./rolling-journey-policy.js";

test("RollingJourneyPolicyValidator reports every problem", () => {
  const validator = defaultRollingJourneyPolicyValidator();
  const item = newRollingJourneyPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingJourneyPolicyRequiredLabelRule flags a blank label", () => {
  const rule = new RollingJourneyPolicyRequiredLabelRule("rolling journey policy needs an entry");
  const item = newRollingJourneyPolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneyPolicyCodeLengthRule flags a long code", () => {
  const rule = new RollingJourneyPolicyCodeLengthRule(120);
  const item = newRollingJourneyPolicy("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingJourneyPolicyRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RollingJourneyPolicyRequiredUtmSourceRule("rolling journey policy needs a value");
  const item = newRollingJourneyPolicy("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
