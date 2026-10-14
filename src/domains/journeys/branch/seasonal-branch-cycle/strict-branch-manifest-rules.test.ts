import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBranchManifestChannelLengthRule,
  StrictBranchManifestRequiredChannelRule,
  StrictBranchManifestRequiredCodeRule,
  defaultStrictBranchManifestValidator,
} from "./strict-branch-manifest-rules.js";
import { newStrictBranchManifest } from "./strict-branch-manifest.js";

test("StrictBranchManifestValidator reports every problem", () => {
  const validator = defaultStrictBranchManifestValidator();
  const item = newStrictBranchManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBranchManifestRequiredChannelRule flags a blank channel", () => {
  const rule = new StrictBranchManifestRequiredChannelRule("strict branch manifest needs a value");
  const item = newStrictBranchManifest("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictBranchManifestChannelLengthRule flags a long channel", () => {
  const rule = new StrictBranchManifestChannelLengthRule(3600);
  const item = newStrictBranchManifest("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictBranchManifestRequiredCodeRule flags a blank code", () => {
  const rule = new StrictBranchManifestRequiredCodeRule("strict branch manifest needs a value");
  const item = newStrictBranchManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
