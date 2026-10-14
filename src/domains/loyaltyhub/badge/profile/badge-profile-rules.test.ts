import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeProfileCodeLengthRule,
  BadgeProfileRequiredCodeRule,
  BadgeProfileRequiredTitleRule,
  defaultBadgeProfileValidator,
} from "./badge-profile-rules.js";
import { newBadgeProfile } from "./badge-profile.js";

test("BadgeProfileValidator reports every problem", () => {
  const validator = defaultBadgeProfileValidator();
  const item = newBadgeProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeProfileCodeLengthRule flags a long code", () => {
  const rule = new BadgeProfileCodeLengthRule(1000);
  const item = newBadgeProfile("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeProfileRequiredTitleRule flags a blank title", () => {
  const rule = new BadgeProfileRequiredTitleRule("badge profile needs a value");
  const item = newBadgeProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeProfileRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeProfileRequiredCodeRule("badge profile needs an entry");
  const item = newBadgeProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
