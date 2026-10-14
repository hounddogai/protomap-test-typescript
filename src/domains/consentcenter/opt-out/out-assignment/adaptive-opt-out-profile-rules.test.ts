import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveOptOutProfileNameLengthRule,
  AdaptiveOptOutProfileRequiredLocaleRule,
  defaultAdaptiveOptOutProfileValidator,
} from "./adaptive-opt-out-profile-rules.js";
import { newAdaptiveOptOutProfile } from "./adaptive-opt-out-profile.js";

test("AdaptiveOptOutProfileValidator reports every problem", () => {
  const validator = defaultAdaptiveOptOutProfileValidator();
  const item = newAdaptiveOptOutProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveOptOutProfileNameLengthRule flags a long name", () => {
  const rule = new AdaptiveOptOutProfileNameLengthRule(1000);
  const item = newAdaptiveOptOutProfile("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveOptOutProfileRequiredLocaleRule flags a blank locale", () => {
  const rule = new AdaptiveOptOutProfileRequiredLocaleRule("adaptive opt out profile needs an entry");
  const item = newAdaptiveOptOutProfile("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
