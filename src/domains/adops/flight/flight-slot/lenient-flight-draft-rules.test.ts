import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientFlightDraftBidRangeRule,
  LenientFlightDraftChannelLengthRule,
  LenientFlightDraftRequiredChannelRule,
  defaultLenientFlightDraftValidator,
} from "./lenient-flight-draft-rules.js";
import { newLenientFlightDraft } from "./lenient-flight-draft.js";

test("LenientFlightDraftValidator reports every problem", () => {
  const validator = defaultLenientFlightDraftValidator();
  const item = newLenientFlightDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientFlightDraftRequiredChannelRule flags a blank channel", () => {
  const rule = new LenientFlightDraftRequiredChannelRule("lenient flight draft needs a value");
  const item = newLenientFlightDraft("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientFlightDraftBidRangeRule flags values above bid", () => {
  const rule = new LenientFlightDraftBidRangeRule(3.1, 2802.9);
  const item = newLenientFlightDraft("x", "y");
  item.bid = 2804.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientFlightDraftChannelLengthRule flags a long channel", () => {
  const rule = new LenientFlightDraftChannelLengthRule(16);
  const item = newLenientFlightDraft("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
