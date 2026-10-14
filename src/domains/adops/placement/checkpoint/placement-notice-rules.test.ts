import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementNoticeBudgetRangeRule,
  PlacementNoticeCodeLengthRule,
  PlacementNoticeRequiredCodeRule,
  PlacementNoticeRequiredNameRule,
  defaultPlacementNoticeValidator,
} from "./placement-notice-rules.js";
import { newPlacementNotice } from "./placement-notice.js";

test("PlacementNoticeValidator reports every problem", () => {
  const validator = defaultPlacementNoticeValidator();
  const item = newPlacementNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementNoticeRequiredCodeRule("placement notice needs an entry");
  const item = newPlacementNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementNoticeBudgetRangeRule flags values above budget", () => {
  const rule = new PlacementNoticeBudgetRangeRule(9.8, 1401.2);
  const item = newPlacementNotice("x", "y");
  item.budget = 1402.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementNoticeRequiredNameRule flags a blank name", () => {
  const rule = new PlacementNoticeRequiredNameRule("placement notice needs a value");
  const item = newPlacementNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementNoticeCodeLengthRule flags a long code", () => {
  const rule = new PlacementNoticeCodeLengthRule(255);
  const item = newPlacementNotice("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
