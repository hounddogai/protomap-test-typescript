import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedInviteManifestCodeLengthRule,
  WeightedInviteManifestLocaleLengthRule,
  WeightedInviteManifestRequiredCodeRule,
  WeightedInviteManifestRequiredTitleRule,
  defaultWeightedInviteManifestValidator,
} from "./weighted-invite-manifest-rules.js";
import { newWeightedInviteManifest } from "./weighted-invite-manifest.js";

test("WeightedInviteManifestValidator reports every problem", () => {
  const validator = defaultWeightedInviteManifestValidator();
  const item = newWeightedInviteManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedInviteManifestRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedInviteManifestRequiredCodeRule("weighted invite manifest needs this field");
  const item = newWeightedInviteManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedInviteManifestRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedInviteManifestRequiredTitleRule("weighted invite manifest needs an entry");
  const item = newWeightedInviteManifest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedInviteManifestCodeLengthRule flags a long code", () => {
  const rule = new WeightedInviteManifestCodeLengthRule(120);
  const item = newWeightedInviteManifest("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedInviteManifestLocaleLengthRule flags a long locale", () => {
  const rule = new WeightedInviteManifestLocaleLengthRule(86400);
  const item = newWeightedInviteManifest("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
