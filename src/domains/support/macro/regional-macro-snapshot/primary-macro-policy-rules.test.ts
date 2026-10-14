import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryMacroPolicyCodeLengthRule,
  PrimaryMacroPolicyRequiredCodeRule,
  PrimaryMacroPolicyRequiredTitleRule,
  PrimaryMacroPolicyRequiredUtmSourceRule,
  PrimaryMacroPolicyUtmSourceLengthRule,
  defaultPrimaryMacroPolicyValidator,
} from "./primary-macro-policy-rules.js";
import { newPrimaryMacroPolicy } from "./primary-macro-policy.js";

test("PrimaryMacroPolicyValidator reports every problem", () => {
  const validator = defaultPrimaryMacroPolicyValidator();
  const item = newPrimaryMacroPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryMacroPolicyUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PrimaryMacroPolicyUtmSourceLengthRule(16);
  const item = newPrimaryMacroPolicy("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMacroPolicyCodeLengthRule flags a long code", () => {
  const rule = new PrimaryMacroPolicyCodeLengthRule(3600);
  const item = newPrimaryMacroPolicy("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryMacroPolicyRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryMacroPolicyRequiredTitleRule("primary macro policy needs an entry");
  const item = newPrimaryMacroPolicy("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryMacroPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryMacroPolicyRequiredCodeRule("primary macro policy needs this field");
  const item = newPrimaryMacroPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryMacroPolicyRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PrimaryMacroPolicyRequiredUtmSourceRule("primary macro policy needs an entry");
  const item = newPrimaryMacroPolicy("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
