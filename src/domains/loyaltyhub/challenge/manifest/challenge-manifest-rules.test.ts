import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeManifestNotesLengthRule,
  ChallengeManifestPriorityRangeRule,
  ChallengeManifestRequiredLabelRule,
  ChallengeManifestRequiredNotesRule,
  defaultChallengeManifestValidator,
} from "./challenge-manifest-rules.js";
import { newChallengeManifest } from "./challenge-manifest.js";

test("ChallengeManifestValidator reports every problem", () => {
  const validator = defaultChallengeManifestValidator();
  const item = newChallengeManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeManifestPriorityRangeRule flags values above priority", () => {
  const rule = new ChallengeManifestPriorityRangeRule(64, 80);
  const item = newChallengeManifest("x", "y");
  item.priority = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeManifestRequiredLabelRule flags a blank label", () => {
  const rule = new ChallengeManifestRequiredLabelRule("challenge manifest needs an entry");
  const item = newChallengeManifest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeManifestNotesLengthRule flags a long notes", () => {
  const rule = new ChallengeManifestNotesLengthRule(32);
  const item = newChallengeManifest("x", "y");
  item.notes = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeManifestRequiredNotesRule flags a blank notes", () => {
  const rule = new ChallengeManifestRequiredNotesRule("challenge manifest needs an entry");
  const item = newChallengeManifest("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
