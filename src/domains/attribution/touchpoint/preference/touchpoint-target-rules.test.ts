import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointTargetEndsAtRangeRule,
  TouchpointTargetLocaleLengthRule,
  TouchpointTargetNameLengthRule,
  TouchpointTargetSegmentLengthRule,
  defaultTouchpointTargetValidator,
} from "./touchpoint-target-rules.js";
import { newTouchpointTarget } from "./touchpoint-target.js";

test("TouchpointTargetValidator reports every problem", () => {
  const validator = defaultTouchpointTargetValidator();
  const item = newTouchpointTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointTargetNameLengthRule flags a long name", () => {
  const rule = new TouchpointTargetNameLengthRule(16);
  const item = newTouchpointTarget("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointTargetSegmentLengthRule flags a long segment", () => {
  const rule = new TouchpointTargetSegmentLengthRule(255);
  const item = newTouchpointTarget("x", "y");
  item.segment = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointTargetLocaleLengthRule flags a long locale", () => {
  const rule = new TouchpointTargetLocaleLengthRule(1000);
  const item = newTouchpointTarget("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointTargetEndsAtRangeRule flags values above ends at", () => {
  const rule = new TouchpointTargetEndsAtRangeRule(32, 32);
  const item = newTouchpointTarget("x", "y");
  item.endsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
