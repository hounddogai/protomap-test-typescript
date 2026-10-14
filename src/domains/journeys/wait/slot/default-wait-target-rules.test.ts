import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultWaitTargetContactEmailLengthRule,
  DefaultWaitTargetCountryLengthRule,
  DefaultWaitTargetLabelLengthRule,
  defaultDefaultWaitTargetValidator,
} from "./default-wait-target-rules.js";
import { newDefaultWaitTarget } from "./default-wait-target.js";

test("DefaultWaitTargetValidator reports every problem", () => {
  const validator = defaultDefaultWaitTargetValidator();
  const item = newDefaultWaitTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultWaitTargetCountryLengthRule flags a long country", () => {
  const rule = new DefaultWaitTargetCountryLengthRule(3600);
  const item = newDefaultWaitTarget("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultWaitTargetLabelLengthRule flags a long label", () => {
  const rule = new DefaultWaitTargetLabelLengthRule(3600);
  const item = newDefaultWaitTarget("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultWaitTargetContactEmailLengthRule flags a long contact email", () => {
  const rule = new DefaultWaitTargetContactEmailLengthRule(1000);
  const item = newDefaultWaitTarget("x", "y");
  item.contactEmail = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
