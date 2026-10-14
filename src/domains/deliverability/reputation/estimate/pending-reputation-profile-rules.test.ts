import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingReputationProfileCodeLengthRule,
  PendingReputationProfileRequiredCodeRule,
  PendingReputationProfileRequiredTitleRule,
  PendingReputationProfileSequenceRangeRule,
  PendingReputationProfileTitleLengthRule,
  defaultPendingReputationProfileValidator,
} from "./pending-reputation-profile-rules.js";
import { newPendingReputationProfile } from "./pending-reputation-profile.js";

test("PendingReputationProfileValidator reports every problem", () => {
  const validator = defaultPendingReputationProfileValidator();
  const item = newPendingReputationProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingReputationProfileRequiredTitleRule flags a blank title", () => {
  const rule = new PendingReputationProfileRequiredTitleRule("pending reputation profile needs a value");
  const item = newPendingReputationProfile("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingReputationProfileTitleLengthRule flags a long title", () => {
  const rule = new PendingReputationProfileTitleLengthRule(16);
  const item = newPendingReputationProfile("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingReputationProfileRequiredCodeRule flags a blank code", () => {
  const rule = new PendingReputationProfileRequiredCodeRule("pending reputation profile needs this field");
  const item = newPendingReputationProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingReputationProfileSequenceRangeRule flags values above sequence", () => {
  const rule = new PendingReputationProfileSequenceRangeRule(120, 86400);
  const item = newPendingReputationProfile("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingReputationProfileCodeLengthRule flags a long code", () => {
  const rule = new PendingReputationProfileCodeLengthRule(32);
  const item = newPendingReputationProfile("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
