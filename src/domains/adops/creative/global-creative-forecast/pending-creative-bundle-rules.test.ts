import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCreativeBundleChannelLengthRule,
  PendingCreativeBundleCodeLengthRule,
  PendingCreativeBundleRequiredChannelRule,
  PendingCreativeBundleRequiredNameRule,
  defaultPendingCreativeBundleValidator,
} from "./pending-creative-bundle-rules.js";
import { newPendingCreativeBundle } from "./pending-creative-bundle.js";

test("PendingCreativeBundleValidator reports every problem", () => {
  const validator = defaultPendingCreativeBundleValidator();
  const item = newPendingCreativeBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCreativeBundleChannelLengthRule flags a long channel", () => {
  const rule = new PendingCreativeBundleChannelLengthRule(1000);
  const item = newPendingCreativeBundle("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCreativeBundleCodeLengthRule flags a long code", () => {
  const rule = new PendingCreativeBundleCodeLengthRule(80);
  const item = newPendingCreativeBundle("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCreativeBundleRequiredChannelRule flags a blank channel", () => {
  const rule = new PendingCreativeBundleRequiredChannelRule("pending creative bundle needs a value");
  const item = newPendingCreativeBundle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCreativeBundleRequiredNameRule flags a blank name", () => {
  const rule = new PendingCreativeBundleRequiredNameRule("pending creative bundle needs an entry");
  const item = newPendingCreativeBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
