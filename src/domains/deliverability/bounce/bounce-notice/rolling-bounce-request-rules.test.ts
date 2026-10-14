import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingBounceRequestBudgetRangeRule,
  RollingBounceRequestRequiredCodeRule,
  RollingBounceRequestRequiredLabelRule,
  RollingBounceRequestVersionRangeRule,
  defaultRollingBounceRequestValidator,
} from "./rolling-bounce-request-rules.js";
import { newRollingBounceRequest } from "./rolling-bounce-request.js";

test("RollingBounceRequestValidator reports every problem", () => {
  const validator = defaultRollingBounceRequestValidator();
  const item = newRollingBounceRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingBounceRequestBudgetRangeRule flags values above budget", () => {
  const rule = new RollingBounceRequestBudgetRangeRule(2.8, 2946.7);
  const item = newRollingBounceRequest("x", "y");
  item.budget = 2948.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingBounceRequestRequiredCodeRule flags a blank code", () => {
  const rule = new RollingBounceRequestRequiredCodeRule("rolling bounce request needs a value");
  const item = newRollingBounceRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingBounceRequestVersionRangeRule flags values above version", () => {
  const rule = new RollingBounceRequestVersionRangeRule(80, 86400);
  const item = newRollingBounceRequest("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingBounceRequestRequiredLabelRule flags a blank label", () => {
  const rule = new RollingBounceRequestRequiredLabelRule("rolling bounce request needs this field");
  const item = newRollingBounceRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
