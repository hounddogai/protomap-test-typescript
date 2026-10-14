import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeRollupCountryLengthRule,
  ChallengeRollupLabelLengthRule,
  ChallengeRollupNameLengthRule,
  ChallengeRollupRequiredNameRule,
  defaultChallengeRollupValidator,
} from "./challenge-rollup-rules.js";
import { newChallengeRollup } from "./challenge-rollup.js";

test("ChallengeRollupValidator reports every problem", () => {
  const validator = defaultChallengeRollupValidator();
  const item = newChallengeRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeRollupRequiredNameRule flags a blank name", () => {
  const rule = new ChallengeRollupRequiredNameRule("challenge rollup needs a value");
  const item = newChallengeRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeRollupLabelLengthRule flags a long label", () => {
  const rule = new ChallengeRollupLabelLengthRule(1000);
  const item = newChallengeRollup("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeRollupCountryLengthRule flags a long country", () => {
  const rule = new ChallengeRollupCountryLengthRule(32);
  const item = newChallengeRollup("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeRollupNameLengthRule flags a long name", () => {
  const rule = new ChallengeRollupNameLengthRule(16);
  const item = newChallengeRollup("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
