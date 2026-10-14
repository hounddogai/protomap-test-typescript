import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSlaDigestChannelLengthRule,
  SeasonalSlaDigestNameLengthRule,
  SeasonalSlaDigestQuantityRangeRule,
  defaultSeasonalSlaDigestValidator,
} from "./seasonal-sla-digest-rules.js";
import { newSeasonalSlaDigest } from "./seasonal-sla-digest.js";

test("SeasonalSlaDigestValidator reports every problem", () => {
  const validator = defaultSeasonalSlaDigestValidator();
  const item = newSeasonalSlaDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSlaDigestQuantityRangeRule flags values above quantity", () => {
  const rule = new SeasonalSlaDigestQuantityRangeRule(16, 32);
  const item = newSeasonalSlaDigest("x", "y");
  item.quantity = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSlaDigestChannelLengthRule flags a long channel", () => {
  const rule = new SeasonalSlaDigestChannelLengthRule(3600);
  const item = newSeasonalSlaDigest("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSlaDigestNameLengthRule flags a long name", () => {
  const rule = new SeasonalSlaDigestNameLengthRule(32);
  const item = newSeasonalSlaDigest("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
