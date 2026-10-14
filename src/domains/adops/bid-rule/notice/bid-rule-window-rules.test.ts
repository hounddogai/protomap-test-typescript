import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleWindowRequiredCodeRule,
  BidRuleWindowRequiredUtmSourceRule,
  BidRuleWindowTitleLengthRule,
  defaultBidRuleWindowValidator,
} from "./bid-rule-window-rules.js";
import { newBidRuleWindow } from "./bid-rule-window.js";

test("BidRuleWindowValidator reports every problem", () => {
  const validator = defaultBidRuleWindowValidator();
  const item = newBidRuleWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleWindowTitleLengthRule flags a long title", () => {
  const rule = new BidRuleWindowTitleLengthRule(120);
  const item = newBidRuleWindow("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleWindowRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleWindowRequiredCodeRule("bid rule window needs this field");
  const item = newBidRuleWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BidRuleWindowRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new BidRuleWindowRequiredUtmSourceRule("bid rule window needs this field");
  const item = newBidRuleWindow("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
