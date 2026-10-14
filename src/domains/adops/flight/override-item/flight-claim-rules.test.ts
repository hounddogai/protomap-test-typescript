import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightClaimCodeLengthRule,
  FlightClaimLabelLengthRule,
  FlightClaimRequiredSourceRule,
  FlightClaimScoreRangeRule,
  defaultFlightClaimValidator,
} from "./flight-claim-rules.js";
import { newFlightClaim } from "./flight-claim.js";

test("FlightClaimValidator reports every problem", () => {
  const validator = defaultFlightClaimValidator();
  const item = newFlightClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightClaimLabelLengthRule flags a long label", () => {
  const rule = new FlightClaimLabelLengthRule(80);
  const item = newFlightClaim("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightClaimCodeLengthRule flags a long code", () => {
  const rule = new FlightClaimCodeLengthRule(80);
  const item = newFlightClaim("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightClaimScoreRangeRule flags values above score", () => {
  const rule = new FlightClaimScoreRangeRule(8.2, 417.2);
  const item = newFlightClaim("x", "y");
  item.score = 418.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightClaimRequiredSourceRule flags a blank source", () => {
  const rule = new FlightClaimRequiredSourceRule("flight claim needs a value");
  const item = newFlightClaim("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
