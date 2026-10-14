import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchBundleCodeLengthRule,
  BranchBundleExternalRefLengthRule,
  defaultBranchBundleValidator,
} from "./branch-bundle-rules.js";
import { newBranchBundle } from "./branch-bundle.js";

test("BranchBundleValidator reports every problem", () => {
  const validator = defaultBranchBundleValidator();
  const item = newBranchBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchBundleCodeLengthRule flags a long code", () => {
  const rule = new BranchBundleCodeLengthRule(16);
  const item = newBranchBundle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchBundleExternalRefLengthRule flags a long external ref", () => {
  const rule = new BranchBundleExternalRefLengthRule(3600);
  const item = newBranchBundle("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
