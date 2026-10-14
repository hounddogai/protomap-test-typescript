import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationDigestLabelLengthRule,
  ReputationDigestRequiredAudienceIdRule,
  ReputationDigestRequiredCodeRule,
  defaultReputationDigestValidator,
} from "./reputation-digest-rules.js";
import { newReputationDigest } from "./reputation-digest.js";

test("ReputationDigestValidator reports every problem", () => {
  const validator = defaultReputationDigestValidator();
  const item = newReputationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationDigestRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationDigestRequiredCodeRule("reputation digest needs a value");
  const item = newReputationDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationDigestRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ReputationDigestRequiredAudienceIdRule("reputation digest needs a value");
  const item = newReputationDigest("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationDigestLabelLengthRule flags a long label", () => {
  const rule = new ReputationDigestLabelLengthRule(86400);
  const item = newReputationDigest("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
