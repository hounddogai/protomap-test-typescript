import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelWindowChannelLengthRule,
  FunnelWindowCodeLengthRule,
  FunnelWindowRequiredNameRule,
  FunnelWindowRevisionRangeRule,
  FunnelWindowUtmSourceLengthRule,
  FunnelWindowVersionRangeRule,
  defaultFunnelWindowValidator,
} from "./funnel-window-rules.js";
import { newFunnelWindow } from "./funnel-window.js";

test("FunnelWindowValidator reports every problem", () => {
  const validator = defaultFunnelWindowValidator();
  const item = newFunnelWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelWindowRequiredNameRule flags a blank name", () => {
  const rule = new FunnelWindowRequiredNameRule("funnel window needs this field");
  const item = newFunnelWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelWindowChannelLengthRule flags a long channel", () => {
  const rule = new FunnelWindowChannelLengthRule(255);
  const item = newFunnelWindow("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelWindowUtmSourceLengthRule flags a long utm source", () => {
  const rule = new FunnelWindowUtmSourceLengthRule(80);
  const item = newFunnelWindow("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelWindowVersionRangeRule flags values above version", () => {
  const rule = new FunnelWindowVersionRangeRule(64, 1000);
  const item = newFunnelWindow("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelWindowCodeLengthRule flags a long code", () => {
  const rule = new FunnelWindowCodeLengthRule(120);
  const item = newFunnelWindow("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelWindowRevisionRangeRule flags values above revision", () => {
  const rule = new FunnelWindowRevisionRangeRule(16, 255);
  const item = newFunnelWindow("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
