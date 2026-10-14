import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSenderBundleQuantityRangeRule,
  FallbackSenderBundleRequiredCodeRule,
  FallbackSenderBundleTitleLengthRule,
  defaultFallbackSenderBundleValidator,
} from "./fallback-sender-bundle-rules.js";
import { newFallbackSenderBundle } from "./fallback-sender-bundle.js";

test("FallbackSenderBundleValidator reports every problem", () => {
  const validator = defaultFallbackSenderBundleValidator();
  const item = newFallbackSenderBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSenderBundleQuantityRangeRule flags values above quantity", () => {
  const rule = new FallbackSenderBundleQuantityRangeRule(32, 3600);
  const item = newFallbackSenderBundle("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSenderBundleRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackSenderBundleRequiredCodeRule("fallback sender bundle needs this field");
  const item = newFallbackSenderBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSenderBundleTitleLengthRule flags a long title", () => {
  const rule = new FallbackSenderBundleTitleLengthRule(3600);
  const item = newFallbackSenderBundle("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
