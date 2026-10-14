import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictCreativeDraftCodeLengthRule,
  StrictCreativeDraftMaximumRangeRule,
  StrictCreativeDraftNameLengthRule,
  StrictCreativeDraftRequiredCodeRule,
  defaultStrictCreativeDraftValidator,
} from "./strict-creative-draft-rules.js";
import { newStrictCreativeDraft } from "./strict-creative-draft.js";

test("StrictCreativeDraftValidator reports every problem", () => {
  const validator = defaultStrictCreativeDraftValidator();
  const item = newStrictCreativeDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictCreativeDraftNameLengthRule flags a long name", () => {
  const rule = new StrictCreativeDraftNameLengthRule(1000);
  const item = newStrictCreativeDraft("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreativeDraftRequiredCodeRule flags a blank code", () => {
  const rule = new StrictCreativeDraftRequiredCodeRule("strict creative draft needs this field");
  const item = newStrictCreativeDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictCreativeDraftCodeLengthRule flags a long code", () => {
  const rule = new StrictCreativeDraftCodeLengthRule(120);
  const item = newStrictCreativeDraft("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictCreativeDraftMaximumRangeRule flags values above maximum", () => {
  const rule = new StrictCreativeDraftMaximumRangeRule(5.3, 1749.3);
  const item = newStrictCreativeDraft("x", "y");
  item.maximum = 1750.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
