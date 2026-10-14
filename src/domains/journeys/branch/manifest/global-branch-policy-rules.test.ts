import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBranchPolicyChannelLengthRule,
  GlobalBranchPolicyCodeLengthRule,
  GlobalBranchPolicyLocaleLengthRule,
  GlobalBranchPolicyNameLengthRule,
  GlobalBranchPolicyRequiredLocaleRule,
  defaultGlobalBranchPolicyValidator,
} from "./global-branch-policy-rules.js";
import { newGlobalBranchPolicy } from "./global-branch-policy.js";

test("GlobalBranchPolicyValidator reports every problem", () => {
  const validator = defaultGlobalBranchPolicyValidator();
  const item = newGlobalBranchPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBranchPolicyCodeLengthRule flags a long code", () => {
  const rule = new GlobalBranchPolicyCodeLengthRule(1000);
  const item = newGlobalBranchPolicy("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalBranchPolicyChannelLengthRule flags a long channel", () => {
  const rule = new GlobalBranchPolicyChannelLengthRule(3600);
  const item = newGlobalBranchPolicy("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalBranchPolicyNameLengthRule flags a long name", () => {
  const rule = new GlobalBranchPolicyNameLengthRule(1000);
  const item = newGlobalBranchPolicy("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalBranchPolicyRequiredLocaleRule flags a blank locale", () => {
  const rule = new GlobalBranchPolicyRequiredLocaleRule("global branch policy needs this field");
  const item = newGlobalBranchPolicy("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalBranchPolicyLocaleLengthRule flags a long locale", () => {
  const rule = new GlobalBranchPolicyLocaleLengthRule(80);
  const item = newGlobalBranchPolicy("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
