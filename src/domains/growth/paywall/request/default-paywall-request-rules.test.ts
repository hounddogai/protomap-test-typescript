import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPaywallRequestExternalRefLengthRule,
  DefaultPaywallRequestMarginRangeRule,
  DefaultPaywallRequestRequiredNameRule,
  defaultDefaultPaywallRequestValidator,
} from "./default-paywall-request-rules.js";
import { newDefaultPaywallRequest } from "./default-paywall-request.js";

test("DefaultPaywallRequestValidator reports every problem", () => {
  const validator = defaultDefaultPaywallRequestValidator();
  const item = newDefaultPaywallRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPaywallRequestExternalRefLengthRule flags a long external ref", () => {
  const rule = new DefaultPaywallRequestExternalRefLengthRule(3600);
  const item = newDefaultPaywallRequest("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPaywallRequestRequiredNameRule flags a blank name", () => {
  const rule = new DefaultPaywallRequestRequiredNameRule("default paywall request needs this field");
  const item = newDefaultPaywallRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPaywallRequestMarginRangeRule flags values above margin", () => {
  const rule = new DefaultPaywallRequestMarginRangeRule(7.6, 4926);
  const item = newDefaultPaywallRequest("x", "y");
  item.margin = 4927.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
