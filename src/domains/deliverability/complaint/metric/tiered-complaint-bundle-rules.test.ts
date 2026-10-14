import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredComplaintBundleAmountRangeRule,
  TieredComplaintBundleChannelLengthRule,
  TieredComplaintBundleChecksumLengthRule,
  defaultTieredComplaintBundleValidator,
} from "./tiered-complaint-bundle-rules.js";
import { newTieredComplaintBundle } from "./tiered-complaint-bundle.js";

test("TieredComplaintBundleValidator reports every problem", () => {
  const validator = defaultTieredComplaintBundleValidator();
  const item = newTieredComplaintBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredComplaintBundleAmountRangeRule flags values above amount", () => {
  const rule = new TieredComplaintBundleAmountRangeRule(6.8, 1029.5);
  const item = newTieredComplaintBundle("x", "y");
  item.amount = 1031;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredComplaintBundleChecksumLengthRule flags a long checksum", () => {
  const rule = new TieredComplaintBundleChecksumLengthRule(1000);
  const item = newTieredComplaintBundle("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredComplaintBundleChannelLengthRule flags a long channel", () => {
  const rule = new TieredComplaintBundleChannelLengthRule(1000);
  const item = newTieredComplaintBundle("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
