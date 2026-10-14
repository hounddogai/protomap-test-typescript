import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalRedemptionEntryBidRangeRule,
  RegionalRedemptionEntryChannelLengthRule,
  RegionalRedemptionEntryNameLengthRule,
  defaultRegionalRedemptionEntryValidator,
} from "./regional-redemption-entry-rules.js";
import { newRegionalRedemptionEntry } from "./regional-redemption-entry.js";

test("RegionalRedemptionEntryValidator reports every problem", () => {
  const validator = defaultRegionalRedemptionEntryValidator();
  const item = newRegionalRedemptionEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalRedemptionEntryNameLengthRule flags a long name", () => {
  const rule = new RegionalRedemptionEntryNameLengthRule(120);
  const item = newRegionalRedemptionEntry("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalRedemptionEntryBidRangeRule flags values above bid", () => {
  const rule = new RegionalRedemptionEntryBidRangeRule(8.4, 3796);
  const item = newRegionalRedemptionEntry("x", "y");
  item.bid = 3797.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalRedemptionEntryChannelLengthRule flags a long channel", () => {
  const rule = new RegionalRedemptionEntryChannelLengthRule(32);
  const item = newRegionalRedemptionEntry("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
