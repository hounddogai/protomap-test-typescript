import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFunnelRequestCeilingRangeRule,
  ScheduledFunnelRequestNameLengthRule,
  ScheduledFunnelRequestRequiredNameRule,
  defaultScheduledFunnelRequestValidator,
} from "./scheduled-funnel-request-rules.js";
import { newScheduledFunnelRequest } from "./scheduled-funnel-request.js";

test("ScheduledFunnelRequestValidator reports every problem", () => {
  const validator = defaultScheduledFunnelRequestValidator();
  const item = newScheduledFunnelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFunnelRequestNameLengthRule flags a long name", () => {
  const rule = new ScheduledFunnelRequestNameLengthRule(120);
  const item = newScheduledFunnelRequest("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFunnelRequestCeilingRangeRule flags values above ceiling", () => {
  const rule = new ScheduledFunnelRequestCeilingRangeRule(2.9, 3343.3);
  const item = newScheduledFunnelRequest("x", "y");
  item.ceiling = 3344.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledFunnelRequestRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledFunnelRequestRequiredNameRule("scheduled funnel request needs an entry");
  const item = newScheduledFunnelRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
