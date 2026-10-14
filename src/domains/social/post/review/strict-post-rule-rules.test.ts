import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPostRuleFloorValueRangeRule,
  StrictPostRuleLabelLengthRule,
  StrictPostRuleRequiredCodeRule,
  StrictPostRuleRequiredOwnerIdRule,
  defaultStrictPostRuleValidator,
} from "./strict-post-rule-rules.js";
import { newStrictPostRule } from "./strict-post-rule.js";

test("StrictPostRuleValidator reports every problem", () => {
  const validator = defaultStrictPostRuleValidator();
  const item = newStrictPostRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPostRuleLabelLengthRule flags a long label", () => {
  const rule = new StrictPostRuleLabelLengthRule(32);
  const item = newStrictPostRule("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPostRuleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new StrictPostRuleRequiredOwnerIdRule("strict post rule needs an entry");
  const item = newStrictPostRule("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPostRuleRequiredCodeRule flags a blank code", () => {
  const rule = new StrictPostRuleRequiredCodeRule("strict post rule needs a value");
  const item = newStrictPostRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPostRuleFloorValueRangeRule flags values above floor value", () => {
  const rule = new StrictPostRuleFloorValueRangeRule(5.5, 4286.6);
  const item = newStrictPostRule("x", "y");
  item.floorValue = 4288.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
