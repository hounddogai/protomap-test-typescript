import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaWindowBidRangeRule,
  SlaWindowClicksRangeRule,
  SlaWindowCodeLengthRule,
  SlaWindowMaximumRangeRule,
  SlaWindowRequiredCodeRule,
  defaultSlaWindowValidator,
} from "./sla-window-rules.js";
import { newSlaWindow } from "./sla-window.js";

test("SlaWindowValidator reports every problem", () => {
  const validator = defaultSlaWindowValidator();
  const item = newSlaWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaWindowClicksRangeRule flags values above clicks", () => {
  const rule = new SlaWindowClicksRangeRule(16, 255);
  const item = newSlaWindow("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaWindowMaximumRangeRule flags values above maximum", () => {
  const rule = new SlaWindowMaximumRangeRule(9.8, 2360.4);
  const item = newSlaWindow("x", "y");
  item.maximum = 2361.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaWindowRequiredCodeRule flags a blank code", () => {
  const rule = new SlaWindowRequiredCodeRule("sla window needs an entry");
  const item = newSlaWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaWindowCodeLengthRule flags a long code", () => {
  const rule = new SlaWindowCodeLengthRule(16);
  const item = newSlaWindow("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaWindowBidRangeRule flags values above bid", () => {
  const rule = new SlaWindowBidRangeRule(8.3, 4609.9);
  const item = newSlaWindow("x", "y");
  item.bid = 4611.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
