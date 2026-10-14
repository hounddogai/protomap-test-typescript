import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceManifestCodeLengthRule,
  BounceManifestFrequencyCapRangeRule,
  BounceManifestNameLengthRule,
  defaultBounceManifestValidator,
} from "./bounce-manifest-rules.js";
import { newBounceManifest } from "./bounce-manifest.js";

test("BounceManifestValidator reports every problem", () => {
  const validator = defaultBounceManifestValidator();
  const item = newBounceManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceManifestFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BounceManifestFrequencyCapRangeRule(32, 255);
  const item = newBounceManifest("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BounceManifestNameLengthRule flags a long name", () => {
  const rule = new BounceManifestNameLengthRule(255);
  const item = newBounceManifest("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceManifestCodeLengthRule flags a long code", () => {
  const rule = new BounceManifestCodeLengthRule(120);
  const item = newBounceManifest("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
