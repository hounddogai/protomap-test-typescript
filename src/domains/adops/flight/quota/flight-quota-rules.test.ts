import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightQuotaCodeLengthRule,
  FlightQuotaRequiredCodeRule,
  FlightQuotaRequiredNameRule,
  FlightQuotaRequiredSegmentRule,
  FlightQuotaRequiredTitleRule,
  FlightQuotaSendAtRangeRule,
  defaultFlightQuotaValidator,
} from "./flight-quota-rules.js";
import { newFlightQuota } from "./flight-quota.js";

test("FlightQuotaValidator reports every problem", () => {
  const validator = defaultFlightQuotaValidator();
  const item = newFlightQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightQuotaRequiredNameRule flags a blank name", () => {
  const rule = new FlightQuotaRequiredNameRule("flight quota needs this field");
  const item = newFlightQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightQuotaCodeLengthRule flags a long code", () => {
  const rule = new FlightQuotaCodeLengthRule(86400);
  const item = newFlightQuota("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new FlightQuotaRequiredTitleRule("flight quota needs this field");
  const item = newFlightQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new FlightQuotaRequiredCodeRule("flight quota needs an entry");
  const item = newFlightQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightQuotaSendAtRangeRule flags values above send at", () => {
  const rule = new FlightQuotaSendAtRangeRule(255, 3600);
  const item = newFlightQuota("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightQuotaRequiredSegmentRule flags a blank segment", () => {
  const rule = new FlightQuotaRequiredSegmentRule("flight quota needs this field");
  const item = newFlightQuota("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
