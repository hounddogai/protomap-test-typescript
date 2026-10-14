import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryChallengeManifestCodeLengthRule,
  PrimaryChallengeManifestNameLengthRule,
  PrimaryChallengeManifestRequiredCategoryRule,
  PrimaryChallengeManifestRequiredCodeRule,
  PrimaryChallengeManifestRequiredContactEmailRule,
  PrimaryChallengeManifestThresholdRangeRule,
  defaultPrimaryChallengeManifestValidator,
} from "./primary-challenge-manifest-rules.js";
import { newPrimaryChallengeManifest } from "./primary-challenge-manifest.js";

test("PrimaryChallengeManifestValidator reports every problem", () => {
  const validator = defaultPrimaryChallengeManifestValidator();
  const item = newPrimaryChallengeManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryChallengeManifestRequiredCategoryRule flags a blank category", () => {
  const rule = new PrimaryChallengeManifestRequiredCategoryRule("primary challenge manifest needs an entry");
  const item = newPrimaryChallengeManifest("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryChallengeManifestThresholdRangeRule flags values above threshold", () => {
  const rule = new PrimaryChallengeManifestThresholdRangeRule(2.7, 1214.5);
  const item = newPrimaryChallengeManifest("x", "y");
  item.threshold = 1216;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryChallengeManifestNameLengthRule flags a long name", () => {
  const rule = new PrimaryChallengeManifestNameLengthRule(86400);
  const item = newPrimaryChallengeManifest("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryChallengeManifestCodeLengthRule flags a long code", () => {
  const rule = new PrimaryChallengeManifestCodeLengthRule(16);
  const item = newPrimaryChallengeManifest("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryChallengeManifestRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryChallengeManifestRequiredCodeRule("primary challenge manifest needs this field");
  const item = newPrimaryChallengeManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryChallengeManifestRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new PrimaryChallengeManifestRequiredContactEmailRule("primary challenge manifest needs an entry");
  const item = newPrimaryChallengeManifest("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
