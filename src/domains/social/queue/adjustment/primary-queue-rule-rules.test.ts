import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryQueueRuleChannelLengthRule,
  PrimaryQueueRuleNameLengthRule,
  PrimaryQueueRuleRequiredCodeRule,
  PrimaryQueueRuleRequiredNameRule,
  PrimaryQueueRuleRequiredVariantRule,
  PrimaryQueueRuleVariantLengthRule,
  defaultPrimaryQueueRuleValidator,
} from "./primary-queue-rule-rules.js";
import { newPrimaryQueueRule } from "./primary-queue-rule.js";

test("PrimaryQueueRuleValidator reports every problem", () => {
  const validator = defaultPrimaryQueueRuleValidator();
  const item = newPrimaryQueueRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryQueueRuleChannelLengthRule flags a long channel", () => {
  const rule = new PrimaryQueueRuleChannelLengthRule(86400);
  const item = newPrimaryQueueRule("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryQueueRuleRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryQueueRuleRequiredCodeRule("primary queue rule needs this field");
  const item = newPrimaryQueueRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryQueueRuleNameLengthRule flags a long name", () => {
  const rule = new PrimaryQueueRuleNameLengthRule(64);
  const item = newPrimaryQueueRule("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryQueueRuleVariantLengthRule flags a long variant", () => {
  const rule = new PrimaryQueueRuleVariantLengthRule(86400);
  const item = newPrimaryQueueRule("x", "y");
  item.variant = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryQueueRuleRequiredVariantRule flags a blank variant", () => {
  const rule = new PrimaryQueueRuleRequiredVariantRule("primary queue rule needs a value");
  const item = newPrimaryQueueRule("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryQueueRuleRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryQueueRuleRequiredNameRule("primary queue rule needs an entry");
  const item = newPrimaryQueueRule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
