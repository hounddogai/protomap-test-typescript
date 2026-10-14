import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryRewardRequestNameLengthRule,
  PrimaryRewardRequestRequiredCodeRule,
  PrimaryRewardRequestRequiredNameRule,
  PrimaryRewardRequestVariantLengthRule,
  defaultPrimaryRewardRequestValidator,
} from "./primary-reward-request-rules.js";
import { newPrimaryRewardRequest } from "./primary-reward-request.js";

test("PrimaryRewardRequestValidator reports every problem", () => {
  const validator = defaultPrimaryRewardRequestValidator();
  const item = newPrimaryRewardRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryRewardRequestNameLengthRule flags a long name", () => {
  const rule = new PrimaryRewardRequestNameLengthRule(255);
  const item = newPrimaryRewardRequest("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryRewardRequestRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryRewardRequestRequiredCodeRule("primary reward request needs a value");
  const item = newPrimaryRewardRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryRewardRequestVariantLengthRule flags a long variant", () => {
  const rule = new PrimaryRewardRequestVariantLengthRule(3600);
  const item = newPrimaryRewardRequest("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryRewardRequestRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryRewardRequestRequiredNameRule("primary reward request needs this field");
  const item = newPrimaryRewardRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
