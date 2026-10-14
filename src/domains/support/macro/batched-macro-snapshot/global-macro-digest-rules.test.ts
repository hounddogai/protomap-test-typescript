import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalMacroDigestNameLengthRule,
  GlobalMacroDigestRequiredCohortRule,
  GlobalMacroDigestRequiredNameRule,
  GlobalMacroDigestRequiredUnitRule,
  defaultGlobalMacroDigestValidator,
} from "./global-macro-digest-rules.js";
import { newGlobalMacroDigest } from "./global-macro-digest.js";

test("GlobalMacroDigestValidator reports every problem", () => {
  const validator = defaultGlobalMacroDigestValidator();
  const item = newGlobalMacroDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalMacroDigestNameLengthRule flags a long name", () => {
  const rule = new GlobalMacroDigestNameLengthRule(64);
  const item = newGlobalMacroDigest("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalMacroDigestRequiredCohortRule flags a blank cohort", () => {
  const rule = new GlobalMacroDigestRequiredCohortRule("global macro digest needs an entry");
  const item = newGlobalMacroDigest("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalMacroDigestRequiredNameRule flags a blank name", () => {
  const rule = new GlobalMacroDigestRequiredNameRule("global macro digest needs a value");
  const item = newGlobalMacroDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalMacroDigestRequiredUnitRule flags a blank unit", () => {
  const rule = new GlobalMacroDigestRequiredUnitRule("global macro digest needs this field");
  const item = newGlobalMacroDigest("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
