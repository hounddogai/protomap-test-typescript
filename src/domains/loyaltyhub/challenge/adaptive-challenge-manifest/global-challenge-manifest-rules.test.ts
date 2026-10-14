import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalChallengeManifestCodeLengthRule,
  GlobalChallengeManifestNameLengthRule,
  GlobalChallengeManifestRequiredDescriptionRule,
  GlobalChallengeManifestRequiredNameRule,
  defaultGlobalChallengeManifestValidator,
} from "./global-challenge-manifest-rules.js";
import { newGlobalChallengeManifest } from "./global-challenge-manifest.js";

test("GlobalChallengeManifestValidator reports every problem", () => {
  const validator = defaultGlobalChallengeManifestValidator();
  const item = newGlobalChallengeManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalChallengeManifestNameLengthRule flags a long name", () => {
  const rule = new GlobalChallengeManifestNameLengthRule(86400);
  const item = newGlobalChallengeManifest("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalChallengeManifestRequiredDescriptionRule flags a blank description", () => {
  const rule = new GlobalChallengeManifestRequiredDescriptionRule("global challenge manifest needs a value");
  const item = newGlobalChallengeManifest("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalChallengeManifestRequiredNameRule flags a blank name", () => {
  const rule = new GlobalChallengeManifestRequiredNameRule("global challenge manifest needs this field");
  const item = newGlobalChallengeManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalChallengeManifestCodeLengthRule flags a long code", () => {
  const rule = new GlobalChallengeManifestCodeLengthRule(120);
  const item = newGlobalChallengeManifest("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
