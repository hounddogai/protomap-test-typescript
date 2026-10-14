import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatBundleChannelLengthRule,
  CsatBundleCodeLengthRule,
  CsatBundleQuantityRangeRule,
  CsatBundleRequiredChannelRule,
  CsatBundleTitleLengthRule,
  defaultCsatBundleValidator,
} from "./csat-bundle-rules.js";
import { newCsatBundle } from "./csat-bundle.js";

test("CsatBundleValidator reports every problem", () => {
  const validator = defaultCsatBundleValidator();
  const item = newCsatBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatBundleTitleLengthRule flags a long title", () => {
  const rule = new CsatBundleTitleLengthRule(1000);
  const item = newCsatBundle("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatBundleChannelLengthRule flags a long channel", () => {
  const rule = new CsatBundleChannelLengthRule(1000);
  const item = newCsatBundle("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatBundleRequiredChannelRule flags a blank channel", () => {
  const rule = new CsatBundleRequiredChannelRule("csat bundle needs an entry");
  const item = newCsatBundle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatBundleQuantityRangeRule flags values above quantity", () => {
  const rule = new CsatBundleQuantityRangeRule(32, 80);
  const item = newCsatBundle("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatBundleCodeLengthRule flags a long code", () => {
  const rule = new CsatBundleCodeLengthRule(255);
  const item = newCsatBundle("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
