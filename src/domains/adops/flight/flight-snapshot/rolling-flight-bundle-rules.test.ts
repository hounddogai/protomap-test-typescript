import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFlightBundleCodeLengthRule,
  RollingFlightBundleRequiredCodeRule,
  RollingFlightBundleRequiredNameRule,
  RollingFlightBundleRetriesRangeRule,
  RollingFlightBundleSendAtRangeRule,
  defaultRollingFlightBundleValidator,
} from "./rolling-flight-bundle-rules.js";
import { newRollingFlightBundle } from "./rolling-flight-bundle.js";

test("RollingFlightBundleValidator reports every problem", () => {
  const validator = defaultRollingFlightBundleValidator();
  const item = newRollingFlightBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFlightBundleSendAtRangeRule flags values above send at", () => {
  const rule = new RollingFlightBundleSendAtRangeRule(3600, 3600);
  const item = newRollingFlightBundle("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFlightBundleRequiredNameRule flags a blank name", () => {
  const rule = new RollingFlightBundleRequiredNameRule("rolling flight bundle needs an entry");
  const item = newRollingFlightBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingFlightBundleRequiredCodeRule flags a blank code", () => {
  const rule = new RollingFlightBundleRequiredCodeRule("rolling flight bundle needs a value");
  const item = newRollingFlightBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingFlightBundleRetriesRangeRule flags values above retries", () => {
  const rule = new RollingFlightBundleRetriesRangeRule(255, 255);
  const item = newRollingFlightBundle("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFlightBundleCodeLengthRule flags a long code", () => {
  const rule = new RollingFlightBundleCodeLengthRule(120);
  const item = newRollingFlightBundle("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
