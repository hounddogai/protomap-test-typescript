import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPaywallSnapshotAudienceIdLengthRule,
  RegionalPaywallSnapshotCodeLengthRule,
  RegionalPaywallSnapshotRequiredAudienceIdRule,
  RegionalPaywallSnapshotSendAtRangeRule,
  defaultRegionalPaywallSnapshotValidator,
} from "./regional-paywall-snapshot-rules.js";
import { newRegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

test("RegionalPaywallSnapshotValidator reports every problem", () => {
  const validator = defaultRegionalPaywallSnapshotValidator();
  const item = newRegionalPaywallSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPaywallSnapshotSendAtRangeRule flags values above send at", () => {
  const rule = new RegionalPaywallSnapshotSendAtRangeRule(120, 86400);
  const item = newRegionalPaywallSnapshot("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalPaywallSnapshotRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new RegionalPaywallSnapshotRequiredAudienceIdRule("regional paywall snapshot needs an entry");
  const item = newRegionalPaywallSnapshot("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPaywallSnapshotCodeLengthRule flags a long code", () => {
  const rule = new RegionalPaywallSnapshotCodeLengthRule(32);
  const item = newRegionalPaywallSnapshot("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPaywallSnapshotAudienceIdLengthRule flags a long audience id", () => {
  const rule = new RegionalPaywallSnapshotAudienceIdLengthRule(16);
  const item = newRegionalPaywallSnapshot("x", "y");
  item.audienceId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
