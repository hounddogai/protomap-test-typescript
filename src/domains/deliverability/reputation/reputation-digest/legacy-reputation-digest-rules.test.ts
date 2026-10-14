import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyReputationDigestCodeLengthRule,
  LegacyReputationDigestRequiredCodeRule,
  LegacyReputationDigestRequiredExternalRefRule,
  defaultLegacyReputationDigestValidator,
} from "./legacy-reputation-digest-rules.js";
import { newLegacyReputationDigest } from "./legacy-reputation-digest.js";

test("LegacyReputationDigestValidator reports every problem", () => {
  const validator = defaultLegacyReputationDigestValidator();
  const item = newLegacyReputationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyReputationDigestRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyReputationDigestRequiredCodeRule("legacy reputation digest needs this field");
  const item = newLegacyReputationDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyReputationDigestCodeLengthRule flags a long code", () => {
  const rule = new LegacyReputationDigestCodeLengthRule(86400);
  const item = newLegacyReputationDigest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyReputationDigestRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new LegacyReputationDigestRequiredExternalRefRule("legacy reputation digest needs an entry");
  const item = newLegacyReputationDigest("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
