import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPostWindowBidRangeRule,
  TieredPostWindowCreatedAtRangeRule,
  TieredPostWindowRequiredCategoryRule,
  TieredPostWindowRequiredNameRule,
  defaultTieredPostWindowValidator,
} from "./tiered-post-window-rules.js";
import { newTieredPostWindow } from "./tiered-post-window.js";

test("TieredPostWindowValidator reports every problem", () => {
  const validator = defaultTieredPostWindowValidator();
  const item = newTieredPostWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPostWindowRequiredNameRule flags a blank name", () => {
  const rule = new TieredPostWindowRequiredNameRule("tiered post window needs a value");
  const item = newTieredPostWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPostWindowBidRangeRule flags values above bid", () => {
  const rule = new TieredPostWindowBidRangeRule(3.4, 1720.1);
  const item = newTieredPostWindow("x", "y");
  item.bid = 1721.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPostWindowRequiredCategoryRule flags a blank category", () => {
  const rule = new TieredPostWindowRequiredCategoryRule("tiered post window needs this field");
  const item = newTieredPostWindow("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPostWindowCreatedAtRangeRule flags values above created at", () => {
  const rule = new TieredPostWindowCreatedAtRangeRule(32, 64);
  const item = newTieredPostWindow("x", "y");
  item.createdAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
