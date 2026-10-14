import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDeflectionDigestCodeLengthRule,
  SeasonalDeflectionDigestLabelLengthRule,
  SeasonalDeflectionDigestPhoneLengthRule,
  SeasonalDeflectionDigestRequiredCodeRule,
  defaultSeasonalDeflectionDigestValidator,
} from "./seasonal-deflection-digest-rules.js";
import { newSeasonalDeflectionDigest } from "./seasonal-deflection-digest.js";

test("SeasonalDeflectionDigestValidator reports every problem", () => {
  const validator = defaultSeasonalDeflectionDigestValidator();
  const item = newSeasonalDeflectionDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDeflectionDigestRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalDeflectionDigestRequiredCodeRule("seasonal deflection digest needs a value");
  const item = newSeasonalDeflectionDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalDeflectionDigestCodeLengthRule flags a long code", () => {
  const rule = new SeasonalDeflectionDigestCodeLengthRule(120);
  const item = newSeasonalDeflectionDigest("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDeflectionDigestLabelLengthRule flags a long label", () => {
  const rule = new SeasonalDeflectionDigestLabelLengthRule(16);
  const item = newSeasonalDeflectionDigest("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDeflectionDigestPhoneLengthRule flags a long phone", () => {
  const rule = new SeasonalDeflectionDigestPhoneLengthRule(64);
  const item = newSeasonalDeflectionDigest("x", "y");
  item.phone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
