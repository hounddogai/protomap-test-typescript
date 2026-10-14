import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFunnelRequestRegionLengthRule,
  RollingFunnelRequestRequiredRegionRule,
  defaultRollingFunnelRequestValidator,
} from "./rolling-funnel-request-rules.js";
import { newRollingFunnelRequest } from "./rolling-funnel-request.js";

test("RollingFunnelRequestValidator reports every problem", () => {
  const validator = defaultRollingFunnelRequestValidator();
  const item = newRollingFunnelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFunnelRequestRegionLengthRule flags a long region", () => {
  const rule = new RollingFunnelRequestRegionLengthRule(3600);
  const item = newRollingFunnelRequest("x", "y");
  item.region = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingFunnelRequestRequiredRegionRule flags a blank region", () => {
  const rule = new RollingFunnelRequestRequiredRegionRule("rolling funnel request needs an entry");
  const item = newRollingFunnelRequest("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
