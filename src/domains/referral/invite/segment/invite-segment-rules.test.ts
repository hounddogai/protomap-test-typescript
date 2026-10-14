import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteSegmentAmountRangeRule,
  InviteSegmentCodeLengthRule,
  InviteSegmentRequiredCodeRule,
  InviteSegmentRequiredRegionRule,
  InviteSegmentSendAtRangeRule,
  InviteSegmentTitleLengthRule,
  defaultInviteSegmentValidator,
} from "./invite-segment-rules.js";
import { newInviteSegment } from "./invite-segment.js";

test("InviteSegmentValidator reports every problem", () => {
  const validator = defaultInviteSegmentValidator();
  const item = newInviteSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteSegmentTitleLengthRule flags a long title", () => {
  const rule = new InviteSegmentTitleLengthRule(120);
  const item = newInviteSegment("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteSegmentAmountRangeRule flags values above amount", () => {
  const rule = new InviteSegmentAmountRangeRule(0.4, 1705.7);
  const item = newInviteSegment("x", "y");
  item.amount = 1707.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteSegmentCodeLengthRule flags a long code", () => {
  const rule = new InviteSegmentCodeLengthRule(255);
  const item = newInviteSegment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new InviteSegmentRequiredCodeRule("invite segment needs a value");
  const item = newInviteSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteSegmentSendAtRangeRule flags values above send at", () => {
  const rule = new InviteSegmentSendAtRangeRule(80, 86400);
  const item = newInviteSegment("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteSegmentRequiredRegionRule flags a blank region", () => {
  const rule = new InviteSegmentRequiredRegionRule("invite segment needs this field");
  const item = newInviteSegment("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
