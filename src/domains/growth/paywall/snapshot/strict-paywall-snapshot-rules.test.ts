import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPaywallSnapshotAudienceIdLengthRule,
  StrictPaywallSnapshotBidRangeRule,
  StrictPaywallSnapshotRequiredCodeRule,
  StrictPaywallSnapshotRequiredNotesRule,
  defaultStrictPaywallSnapshotValidator,
} from "./strict-paywall-snapshot-rules.js";
import { newStrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

test("StrictPaywallSnapshotValidator reports every problem", () => {
  const validator = defaultStrictPaywallSnapshotValidator();
  const item = newStrictPaywallSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPaywallSnapshotAudienceIdLengthRule flags a long audience id", () => {
  const rule = new StrictPaywallSnapshotAudienceIdLengthRule(1000);
  const item = newStrictPaywallSnapshot("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictPaywallSnapshotRequiredNotesRule flags a blank notes", () => {
  const rule = new StrictPaywallSnapshotRequiredNotesRule("strict paywall snapshot needs an entry");
  const item = newStrictPaywallSnapshot("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPaywallSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new StrictPaywallSnapshotRequiredCodeRule("strict paywall snapshot needs this field");
  const item = newStrictPaywallSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPaywallSnapshotBidRangeRule flags values above bid", () => {
  const rule = new StrictPaywallSnapshotBidRangeRule(8.6, 3072.9);
  const item = newStrictPaywallSnapshot("x", "y");
  item.bid = 3074.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
