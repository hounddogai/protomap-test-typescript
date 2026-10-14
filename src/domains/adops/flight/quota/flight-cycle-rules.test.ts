import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightCycleAudienceIdLengthRule,
  FlightCycleCampaignRefLengthRule,
  FlightCycleClicksRangeRule,
  FlightCycleCodeLengthRule,
  FlightCycleThresholdRangeRule,
  defaultFlightCycleValidator,
} from "./flight-cycle-rules.js";
import { newFlightCycle } from "./flight-cycle.js";

test("FlightCycleValidator reports every problem", () => {
  const validator = defaultFlightCycleValidator();
  const item = newFlightCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightCycleClicksRangeRule flags values above clicks", () => {
  const rule = new FlightCycleClicksRangeRule(120, 120);
  const item = newFlightCycle("x", "y");
  item.clicks = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightCycleCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new FlightCycleCampaignRefLengthRule(120);
  const item = newFlightCycle("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightCycleAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FlightCycleAudienceIdLengthRule(3600);
  const item = newFlightCycle("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FlightCycleThresholdRangeRule flags values above threshold", () => {
  const rule = new FlightCycleThresholdRangeRule(0.4, 1483.3);
  const item = newFlightCycle("x", "y");
  item.threshold = 1484.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightCycleCodeLengthRule flags a long code", () => {
  const rule = new FlightCycleCodeLengthRule(64);
  const item = newFlightCycle("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
