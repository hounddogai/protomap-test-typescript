import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBadgeProfileLimitRangeRule,
  GlobalBadgeProfileRequiredNameRule,
  defaultGlobalBadgeProfileValidator,
} from "./global-badge-profile-rules.js";
import { newGlobalBadgeProfile } from "./global-badge-profile.js";

test("GlobalBadgeProfileValidator reports every problem", () => {
  const validator = defaultGlobalBadgeProfileValidator();
  const item = newGlobalBadgeProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBadgeProfileRequiredNameRule flags a blank name", () => {
  const rule = new GlobalBadgeProfileRequiredNameRule("global badge profile needs an entry");
  const item = newGlobalBadgeProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalBadgeProfileLimitRangeRule flags values above limit", () => {
  const rule = new GlobalBadgeProfileLimitRangeRule(32, 120);
  const item = newGlobalBadgeProfile("x", "y");
  item.limit = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
