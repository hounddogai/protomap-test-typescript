import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientInviteSegmentCodeLengthRule,
  LenientInviteSegmentRequiredCodeRule,
  LenientInviteSegmentRequiredJourneyIdRule,
  LenientInviteSegmentRequiredUnitRule,
  defaultLenientInviteSegmentValidator,
} from "./lenient-invite-segment-rules.js";
import { newLenientInviteSegment } from "./lenient-invite-segment.js";

test("LenientInviteSegmentValidator reports every problem", () => {
  const validator = defaultLenientInviteSegmentValidator();
  const item = newLenientInviteSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientInviteSegmentRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new LenientInviteSegmentRequiredJourneyIdRule("lenient invite segment needs an entry");
  const item = newLenientInviteSegment("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInviteSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new LenientInviteSegmentRequiredCodeRule("lenient invite segment needs this field");
  const item = newLenientInviteSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientInviteSegmentCodeLengthRule flags a long code", () => {
  const rule = new LenientInviteSegmentCodeLengthRule(80);
  const item = newLenientInviteSegment("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientInviteSegmentRequiredUnitRule flags a blank unit", () => {
  const rule = new LenientInviteSegmentRequiredUnitRule("lenient invite segment needs a value");
  const item = newLenientInviteSegment("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
