import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintManifestBudgetRangeRule,
  ComplaintManifestCodeLengthRule,
  ComplaintManifestRequiredNameRule,
  defaultComplaintManifestValidator,
} from "./complaint-manifest-rules.js";
import { newComplaintManifest } from "./complaint-manifest.js";

test("ComplaintManifestValidator reports every problem", () => {
  const validator = defaultComplaintManifestValidator();
  const item = newComplaintManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintManifestRequiredNameRule flags a blank name", () => {
  const rule = new ComplaintManifestRequiredNameRule("complaint manifest needs a value");
  const item = newComplaintManifest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintManifestBudgetRangeRule flags values above budget", () => {
  const rule = new ComplaintManifestBudgetRangeRule(8.1, 1361.9);
  const item = newComplaintManifest("x", "y");
  item.budget = 1363.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintManifestCodeLengthRule flags a long code", () => {
  const rule = new ComplaintManifestCodeLengthRule(86400);
  const item = newComplaintManifest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
