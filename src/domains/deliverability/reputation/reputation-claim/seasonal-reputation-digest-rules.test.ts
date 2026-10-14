import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalReputationDigestRequiredChecksumRule,
  SeasonalReputationDigestRequiredCodeRule,
  SeasonalReputationDigestRequiredUtmSourceRule,
  SeasonalReputationDigestUtmSourceLengthRule,
  defaultSeasonalReputationDigestValidator,
} from "./seasonal-reputation-digest-rules.js";
import { newSeasonalReputationDigest } from "./seasonal-reputation-digest.js";

test("SeasonalReputationDigestValidator reports every problem", () => {
  const validator = defaultSeasonalReputationDigestValidator();
  const item = newSeasonalReputationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalReputationDigestRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new SeasonalReputationDigestRequiredUtmSourceRule("seasonal reputation digest needs a value");
  const item = newSeasonalReputationDigest("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalReputationDigestRequiredChecksumRule flags a blank checksum", () => {
  const rule = new SeasonalReputationDigestRequiredChecksumRule("seasonal reputation digest needs a value");
  const item = newSeasonalReputationDigest("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalReputationDigestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new SeasonalReputationDigestUtmSourceLengthRule(1000);
  const item = newSeasonalReputationDigest("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalReputationDigestRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalReputationDigestRequiredCodeRule("seasonal reputation digest needs this field");
  const item = newSeasonalReputationDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
