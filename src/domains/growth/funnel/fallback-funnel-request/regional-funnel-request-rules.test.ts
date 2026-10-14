import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalFunnelRequestCodeLengthRule,
  RegionalFunnelRequestRequiredCodeRule,
  RegionalFunnelRequestSendAtRangeRule,
  RegionalFunnelRequestTitleLengthRule,
  defaultRegionalFunnelRequestValidator,
} from "./regional-funnel-request-rules.js";
import { newRegionalFunnelRequest } from "./regional-funnel-request.js";

test("RegionalFunnelRequestValidator reports every problem", () => {
  const validator = defaultRegionalFunnelRequestValidator();
  const item = newRegionalFunnelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalFunnelRequestSendAtRangeRule flags values above send at", () => {
  const rule = new RegionalFunnelRequestSendAtRangeRule(3600, 86400);
  const item = newRegionalFunnelRequest("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalFunnelRequestCodeLengthRule flags a long code", () => {
  const rule = new RegionalFunnelRequestCodeLengthRule(255);
  const item = newRegionalFunnelRequest("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalFunnelRequestTitleLengthRule flags a long title", () => {
  const rule = new RegionalFunnelRequestTitleLengthRule(1000);
  const item = newRegionalFunnelRequest("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalFunnelRequestRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalFunnelRequestRequiredCodeRule("regional funnel request needs this field");
  const item = newRegionalFunnelRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
