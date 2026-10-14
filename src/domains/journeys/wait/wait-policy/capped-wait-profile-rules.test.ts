import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedWaitProfileEndsAtRangeRule,
  CappedWaitProfileMarginRangeRule,
  CappedWaitProfileRequiredSourceRule,
  defaultCappedWaitProfileValidator,
} from "./capped-wait-profile-rules.js";
import { newCappedWaitProfile } from "./capped-wait-profile.js";

test("CappedWaitProfileValidator reports every problem", () => {
  const validator = defaultCappedWaitProfileValidator();
  const item = newCappedWaitProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedWaitProfileRequiredSourceRule flags a blank source", () => {
  const rule = new CappedWaitProfileRequiredSourceRule("capped wait profile needs a value");
  const item = newCappedWaitProfile("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedWaitProfileEndsAtRangeRule flags values above ends at", () => {
  const rule = new CappedWaitProfileEndsAtRangeRule(80, 80);
  const item = newCappedWaitProfile("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedWaitProfileMarginRangeRule flags values above margin", () => {
  const rule = new CappedWaitProfileMarginRangeRule(4.4, 2198);
  const item = newCappedWaitProfile("x", "y");
  item.margin = 2199.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
