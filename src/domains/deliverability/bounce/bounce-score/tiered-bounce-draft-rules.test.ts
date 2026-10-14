import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBounceDraftChannelLengthRule,
  TieredBounceDraftContactEmailLengthRule,
  TieredBounceDraftNameLengthRule,
  TieredBounceDraftRequiredChannelRule,
  TieredBounceDraftRequiredCodeRule,
  TieredBounceDraftScoreRangeRule,
  defaultTieredBounceDraftValidator,
} from "./tiered-bounce-draft-rules.js";
import { newTieredBounceDraft } from "./tiered-bounce-draft.js";

test("TieredBounceDraftValidator reports every problem", () => {
  const validator = defaultTieredBounceDraftValidator();
  const item = newTieredBounceDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBounceDraftRequiredChannelRule flags a blank channel", () => {
  const rule = new TieredBounceDraftRequiredChannelRule("tiered bounce draft needs a value");
  const item = newTieredBounceDraft("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBounceDraftNameLengthRule flags a long name", () => {
  const rule = new TieredBounceDraftNameLengthRule(1000);
  const item = newTieredBounceDraft("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBounceDraftScoreRangeRule flags values above score", () => {
  const rule = new TieredBounceDraftScoreRangeRule(8.4, 1617.5);
  const item = newTieredBounceDraft("x", "y");
  item.score = 1619;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBounceDraftRequiredCodeRule flags a blank code", () => {
  const rule = new TieredBounceDraftRequiredCodeRule("tiered bounce draft needs an entry");
  const item = newTieredBounceDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBounceDraftChannelLengthRule flags a long channel", () => {
  const rule = new TieredBounceDraftChannelLengthRule(3600);
  const item = newTieredBounceDraft("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBounceDraftContactEmailLengthRule flags a long contact email", () => {
  const rule = new TieredBounceDraftContactEmailLengthRule(32);
  const item = newTieredBounceDraft("x", "y");
  item.contactEmail = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
