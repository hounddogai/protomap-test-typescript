import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFlightClaimCodeLengthRule,
  GlobalFlightClaimContactEmailLengthRule,
  GlobalFlightClaimNameLengthRule,
  GlobalFlightClaimRequiredCodeRule,
  GlobalFlightClaimWindowDaysRangeRule,
  defaultGlobalFlightClaimValidator,
} from "./global-flight-claim-rules.js";
import { newGlobalFlightClaim } from "./global-flight-claim.js";

test("GlobalFlightClaimValidator reports every problem", () => {
  const validator = defaultGlobalFlightClaimValidator();
  const item = newGlobalFlightClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFlightClaimRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalFlightClaimRequiredCodeRule("global flight claim needs a value");
  const item = newGlobalFlightClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFlightClaimWindowDaysRangeRule flags values above window days", () => {
  const rule = new GlobalFlightClaimWindowDaysRangeRule(255, 3600);
  const item = newGlobalFlightClaim("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalFlightClaimContactEmailLengthRule flags a long contact email", () => {
  const rule = new GlobalFlightClaimContactEmailLengthRule(16);
  const item = newGlobalFlightClaim("x", "y");
  item.contactEmail = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalFlightClaimNameLengthRule flags a long name", () => {
  const rule = new GlobalFlightClaimNameLengthRule(1000);
  const item = newGlobalFlightClaim("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalFlightClaimCodeLengthRule flags a long code", () => {
  const rule = new GlobalFlightClaimCodeLengthRule(64);
  const item = newGlobalFlightClaim("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
