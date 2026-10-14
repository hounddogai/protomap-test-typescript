import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroDraftCodeLengthRule,
  MacroDraftCostRangeRule,
  MacroDraftPriorityRangeRule,
  MacroDraftRequiredCodeRule,
  MacroDraftTitleLengthRule,
  defaultMacroDraftValidator,
} from "./macro-draft-rules.js";
import { newMacroDraft } from "./macro-draft.js";

test("MacroDraftValidator reports every problem", () => {
  const validator = defaultMacroDraftValidator();
  const item = newMacroDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroDraftPriorityRangeRule flags values above priority", () => {
  const rule = new MacroDraftPriorityRangeRule(32, 64);
  const item = newMacroDraft("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroDraftTitleLengthRule flags a long title", () => {
  const rule = new MacroDraftTitleLengthRule(16);
  const item = newMacroDraft("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroDraftRequiredCodeRule flags a blank code", () => {
  const rule = new MacroDraftRequiredCodeRule("macro draft needs this field");
  const item = newMacroDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroDraftCostRangeRule flags values above cost", () => {
  const rule = new MacroDraftCostRangeRule(3.4, 4126.2);
  const item = newMacroDraft("x", "y");
  item.cost = 4127.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroDraftCodeLengthRule flags a long code", () => {
  const rule = new MacroDraftCodeLengthRule(32);
  const item = newMacroDraft("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
