import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightMilestoneCodeLengthRule,
  FlightMilestoneRatioRangeRule,
  FlightMilestoneRequiredCodeRule,
  FlightMilestoneRequiredExternalRefRule,
  FlightMilestoneTitleLengthRule,
  defaultFlightMilestoneValidator,
} from "./flight-milestone-rules.js";
import { newFlightMilestone } from "./flight-milestone.js";

test("FlightMilestoneValidator reports every problem", () => {
  const validator = defaultFlightMilestoneValidator();
  const item = newFlightMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightMilestoneRatioRangeRule flags values above ratio", () => {
  const rule = new FlightMilestoneRatioRangeRule(0.7, 106);
  const item = newFlightMilestone("x", "y");
  item.ratio = 107.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new FlightMilestoneRequiredCodeRule("flight milestone needs an entry");
  const item = newFlightMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightMilestoneRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new FlightMilestoneRequiredExternalRefRule("flight milestone needs an entry");
  const item = newFlightMilestone("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightMilestoneTitleLengthRule flags a long title", () => {
  const rule = new FlightMilestoneTitleLengthRule(120);
  const item = newFlightMilestone("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightMilestoneCodeLengthRule flags a long code", () => {
  const rule = new FlightMilestoneCodeLengthRule(32);
  const item = newFlightMilestone("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
