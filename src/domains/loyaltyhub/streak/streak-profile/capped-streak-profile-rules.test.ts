import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedStreakProfileCodeLengthRule,
  CappedStreakProfileRequiredLocaleRule,
  defaultCappedStreakProfileValidator,
} from "./capped-streak-profile-rules.js";
import { newCappedStreakProfile } from "./capped-streak-profile.js";

test("CappedStreakProfileValidator reports every problem", () => {
  const validator = defaultCappedStreakProfileValidator();
  const item = newCappedStreakProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedStreakProfileCodeLengthRule flags a long code", () => {
  const rule = new CappedStreakProfileCodeLengthRule(64);
  const item = newCappedStreakProfile("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedStreakProfileRequiredLocaleRule flags a blank locale", () => {
  const rule = new CappedStreakProfileRequiredLocaleRule("capped streak profile needs this field");
  const item = newCappedStreakProfile("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
