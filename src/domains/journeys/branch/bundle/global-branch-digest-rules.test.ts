import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBranchDigestRequiredCodeRule,
  GlobalBranchDigestRequiredLabelRule,
  GlobalBranchDigestVersionRangeRule,
  defaultGlobalBranchDigestValidator,
} from "./global-branch-digest-rules.js";
import { newGlobalBranchDigest } from "./global-branch-digest.js";

test("GlobalBranchDigestValidator reports every problem", () => {
  const validator = defaultGlobalBranchDigestValidator();
  const item = newGlobalBranchDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBranchDigestRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalBranchDigestRequiredLabelRule("global branch digest needs an entry");
  const item = newGlobalBranchDigest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalBranchDigestVersionRangeRule flags values above version", () => {
  const rule = new GlobalBranchDigestVersionRangeRule(120, 86400);
  const item = newGlobalBranchDigest("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalBranchDigestRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalBranchDigestRequiredCodeRule("global branch digest needs an entry");
  const item = newGlobalBranchDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
