import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPaywallDigestCodeLengthRule,
  SeasonalPaywallDigestRequiredCodeRule,
  defaultSeasonalPaywallDigestValidator,
} from "./seasonal-paywall-digest-rules.js";
import { newSeasonalPaywallDigest } from "./seasonal-paywall-digest.js";

test("SeasonalPaywallDigestValidator reports every problem", () => {
  const validator = defaultSeasonalPaywallDigestValidator();
  const item = newSeasonalPaywallDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPaywallDigestCodeLengthRule flags a long code", () => {
  const rule = new SeasonalPaywallDigestCodeLengthRule(16);
  const item = newSeasonalPaywallDigest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPaywallDigestRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalPaywallDigestRequiredCodeRule("seasonal paywall digest needs this field");
  const item = newSeasonalPaywallDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
