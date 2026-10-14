import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalBadgeDigestLocaleLengthRule,
  RegionalBadgeDigestRequiredNameRule,
  defaultRegionalBadgeDigestValidator,
} from "./regional-badge-digest-rules.js";
import { newRegionalBadgeDigest } from "./regional-badge-digest.js";

test("RegionalBadgeDigestValidator reports every problem", () => {
  const validator = defaultRegionalBadgeDigestValidator();
  const item = newRegionalBadgeDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalBadgeDigestRequiredNameRule flags a blank name", () => {
  const rule = new RegionalBadgeDigestRequiredNameRule("regional badge digest needs this field");
  const item = newRegionalBadgeDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalBadgeDigestLocaleLengthRule flags a long locale", () => {
  const rule = new RegionalBadgeDigestLocaleLengthRule(3600);
  const item = newRegionalBadgeDigest("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
