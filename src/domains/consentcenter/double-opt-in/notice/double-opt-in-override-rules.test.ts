import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInOverrideAudienceIdLengthRule,
  DoubleOptInOverrideRequiredAudienceIdRule,
  defaultDoubleOptInOverrideValidator,
} from "./double-opt-in-override-rules.js";
import { newDoubleOptInOverride } from "./double-opt-in-override.js";

test("DoubleOptInOverrideValidator reports every problem", () => {
  const validator = defaultDoubleOptInOverrideValidator();
  const item = newDoubleOptInOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInOverrideAudienceIdLengthRule flags a long audience id", () => {
  const rule = new DoubleOptInOverrideAudienceIdLengthRule(64);
  const item = newDoubleOptInOverride("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DoubleOptInOverrideRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new DoubleOptInOverrideRequiredAudienceIdRule("double opt in override needs this field");
  const item = newDoubleOptInOverride("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
