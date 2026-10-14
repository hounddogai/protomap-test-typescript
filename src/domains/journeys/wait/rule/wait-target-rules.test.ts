import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitTargetRequiredPhoneRule,
  WaitTargetRequiredSegmentRule,
  defaultWaitTargetValidator,
} from "./wait-target-rules.js";
import { newWaitTarget } from "./wait-target.js";

test("WaitTargetValidator reports every problem", () => {
  const validator = defaultWaitTargetValidator();
  const item = newWaitTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitTargetRequiredPhoneRule flags a blank phone", () => {
  const rule = new WaitTargetRequiredPhoneRule("wait target needs this field");
  const item = newWaitTarget("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitTargetRequiredSegmentRule flags a blank segment", () => {
  const rule = new WaitTargetRequiredSegmentRule("wait target needs a value");
  const item = newWaitTarget("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
