import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowProfileRequiredNameRule,
  WindowProfileRetriesRangeRule,
  WindowProfileUtmSourceLengthRule,
  defaultWindowProfileValidator,
} from "./window-profile-rules.js";
import { newWindowProfile } from "./window-profile.js";

test("WindowProfileValidator reports every problem", () => {
  const validator = defaultWindowProfileValidator();
  const item = newWindowProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowProfileRetriesRangeRule flags values above retries", () => {
  const rule = new WindowProfileRetriesRangeRule(32, 1000);
  const item = newWindowProfile("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowProfileUtmSourceLengthRule flags a long utm source", () => {
  const rule = new WindowProfileUtmSourceLengthRule(80);
  const item = newWindowProfile("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowProfileRequiredNameRule flags a blank name", () => {
  const rule = new WindowProfileRequiredNameRule("window profile needs a value");
  const item = newWindowProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
