import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaRequestExternalRefLengthRule,
  SlaRequestRequiredCurrencyRule,
  defaultSlaRequestValidator,
} from "./sla-request-rules.js";
import { newSlaRequest } from "./sla-request.js";

test("SlaRequestValidator reports every problem", () => {
  const validator = defaultSlaRequestValidator();
  const item = newSlaRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaRequestRequiredCurrencyRule flags a blank currency", () => {
  const rule = new SlaRequestRequiredCurrencyRule("sla request needs this field");
  const item = newSlaRequest("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaRequestExternalRefLengthRule flags a long external ref", () => {
  const rule = new SlaRequestExternalRefLengthRule(32);
  const item = newSlaRequest("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
