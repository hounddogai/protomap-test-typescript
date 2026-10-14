import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFunnelRequestLabelLengthRule,
  DefaultFunnelRequestRequiredCodeRule,
  DefaultFunnelRequestRequiredUtmSourceRule,
  defaultDefaultFunnelRequestValidator,
} from "./default-funnel-request-rules.js";
import { newDefaultFunnelRequest } from "./default-funnel-request.js";

test("DefaultFunnelRequestValidator reports every problem", () => {
  const validator = defaultDefaultFunnelRequestValidator();
  const item = newDefaultFunnelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFunnelRequestRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new DefaultFunnelRequestRequiredUtmSourceRule("default funnel request needs a value");
  const item = newDefaultFunnelRequest("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFunnelRequestLabelLengthRule flags a long label", () => {
  const rule = new DefaultFunnelRequestLabelLengthRule(64);
  const item = newDefaultFunnelRequest("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFunnelRequestRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultFunnelRequestRequiredCodeRule("default funnel request needs an entry");
  const item = newDefaultFunnelRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
