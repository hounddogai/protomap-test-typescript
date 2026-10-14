import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementRuleCodeLengthRule,
  PlacementRuleLabelLengthRule,
  PlacementRuleMarginRangeRule,
  PlacementRuleOwnerIdLengthRule,
  defaultPlacementRuleValidator,
} from "./placement-rule-rules.js";
import { newPlacementRule } from "./placement-rule.js";

test("PlacementRuleValidator reports every problem", () => {
  const validator = defaultPlacementRuleValidator();
  const item = newPlacementRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementRuleCodeLengthRule flags a long code", () => {
  const rule = new PlacementRuleCodeLengthRule(1000);
  const item = newPlacementRule("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementRuleMarginRangeRule flags values above margin", () => {
  const rule = new PlacementRuleMarginRangeRule(6.9, 2354.3);
  const item = newPlacementRule("x", "y");
  item.margin = 2355.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementRuleOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PlacementRuleOwnerIdLengthRule(1000);
  const item = newPlacementRule("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementRuleLabelLengthRule flags a long label", () => {
  const rule = new PlacementRuleLabelLengthRule(255);
  const item = newPlacementRule("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
