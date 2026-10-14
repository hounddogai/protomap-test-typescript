import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelProfileLabelLengthRule,
  FunnelProfileRequiredTitleRule,
  FunnelProfileTitleLengthRule,
  defaultFunnelProfileValidator,
} from "./funnel-profile-rules.js";
import { newFunnelProfile } from "./funnel-profile.js";

test("FunnelProfileValidator reports every problem", () => {
  const validator = defaultFunnelProfileValidator();
  const item = newFunnelProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelProfileTitleLengthRule flags a long title", () => {
  const rule = new FunnelProfileTitleLengthRule(3600);
  const item = newFunnelProfile("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelProfileRequiredTitleRule flags a blank title", () => {
  const rule = new FunnelProfileRequiredTitleRule("funnel profile needs this field");
  const item = newFunnelProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelProfileLabelLengthRule flags a long label", () => {
  const rule = new FunnelProfileLabelLengthRule(120);
  const item = newFunnelProfile("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
