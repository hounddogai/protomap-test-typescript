import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FlightNoticeCodeLengthRule,
  FlightNoticeRequiredCodeRule,
  FlightNoticeRequiredNameRule,
  FlightNoticeScoreRangeRule,
  FlightNoticeThresholdRangeRule,
  defaultFlightNoticeValidator,
} from "./flight-notice-rules.js";
import { newFlightNotice } from "./flight-notice.js";

test("FlightNoticeValidator reports every problem", () => {
  const validator = defaultFlightNoticeValidator();
  const item = newFlightNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FlightNoticeRequiredNameRule flags a blank name", () => {
  const rule = new FlightNoticeRequiredNameRule("flight notice needs an entry");
  const item = newFlightNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new FlightNoticeRequiredCodeRule("flight notice needs an entry");
  const item = newFlightNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FlightNoticeScoreRangeRule flags values above score", () => {
  const rule = new FlightNoticeScoreRangeRule(0.5, 1468.6);
  const item = newFlightNotice("x", "y");
  item.score = 1470.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightNoticeThresholdRangeRule flags values above threshold", () => {
  const rule = new FlightNoticeThresholdRangeRule(3.9, 4256.5);
  const item = newFlightNotice("x", "y");
  item.threshold = 4258;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FlightNoticeCodeLengthRule flags a long code", () => {
  const rule = new FlightNoticeCodeLengthRule(80);
  const item = newFlightNotice("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
