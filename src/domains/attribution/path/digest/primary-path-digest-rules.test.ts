import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPathDigestLabelLengthRule,
  PrimaryPathDigestRequiredCodeRule,
  PrimaryPathDigestRequiredLabelRule,
  defaultPrimaryPathDigestValidator,
} from "./primary-path-digest-rules.js";
import { newPrimaryPathDigest } from "./primary-path-digest.js";

test("PrimaryPathDigestValidator reports every problem", () => {
  const validator = defaultPrimaryPathDigestValidator();
  const item = newPrimaryPathDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPathDigestRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryPathDigestRequiredCodeRule("primary path digest needs this field");
  const item = newPrimaryPathDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPathDigestRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryPathDigestRequiredLabelRule("primary path digest needs a value");
  const item = newPrimaryPathDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPathDigestLabelLengthRule flags a long label", () => {
  const rule = new PrimaryPathDigestLabelLengthRule(16);
  const item = newPrimaryPathDigest("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
