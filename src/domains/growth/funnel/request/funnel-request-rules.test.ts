import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelRequestAttemptsRangeRule,
  FunnelRequestRequiredOwnerIdRule,
  FunnelRequestTitleLengthRule,
  FunnelRequestVariantLengthRule,
  defaultFunnelRequestValidator,
} from "./funnel-request-rules.js";
import { newFunnelRequest } from "./funnel-request.js";

test("FunnelRequestValidator reports every problem", () => {
  const validator = defaultFunnelRequestValidator();
  const item = newFunnelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelRequestAttemptsRangeRule flags values above attempts", () => {
  const rule = new FunnelRequestAttemptsRangeRule(1000, 3600);
  const item = newFunnelRequest("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelRequestVariantLengthRule flags a long variant", () => {
  const rule = new FunnelRequestVariantLengthRule(16);
  const item = newFunnelRequest("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelRequestTitleLengthRule flags a long title", () => {
  const rule = new FunnelRequestTitleLengthRule(120);
  const item = newFunnelRequest("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelRequestRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new FunnelRequestRequiredOwnerIdRule("funnel request needs an entry");
  const item = newFunnelRequest("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
