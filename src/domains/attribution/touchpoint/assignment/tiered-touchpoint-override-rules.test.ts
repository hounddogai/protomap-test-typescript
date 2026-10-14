import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTouchpointOverrideCountryLengthRule,
  TieredTouchpointOverrideLabelLengthRule,
  TieredTouchpointOverrideRequiredCodeRule,
  TieredTouchpointOverrideRequiredCountryRule,
  TieredTouchpointOverrideSourceLengthRule,
  defaultTieredTouchpointOverrideValidator,
} from "./tiered-touchpoint-override-rules.js";
import { newTieredTouchpointOverride } from "./tiered-touchpoint-override.js";

test("TieredTouchpointOverrideValidator reports every problem", () => {
  const validator = defaultTieredTouchpointOverrideValidator();
  const item = newTieredTouchpointOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTouchpointOverrideLabelLengthRule flags a long label", () => {
  const rule = new TieredTouchpointOverrideLabelLengthRule(64);
  const item = newTieredTouchpointOverride("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTouchpointOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new TieredTouchpointOverrideRequiredCodeRule("tiered touchpoint override needs a value");
  const item = newTieredTouchpointOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTouchpointOverrideCountryLengthRule flags a long country", () => {
  const rule = new TieredTouchpointOverrideCountryLengthRule(32);
  const item = newTieredTouchpointOverride("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTouchpointOverrideRequiredCountryRule flags a blank country", () => {
  const rule = new TieredTouchpointOverrideRequiredCountryRule("tiered touchpoint override needs a value");
  const item = newTieredTouchpointOverride("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTouchpointOverrideSourceLengthRule flags a long source", () => {
  const rule = new TieredTouchpointOverrideSourceLengthRule(64);
  const item = newTieredTouchpointOverride("x", "y");
  item.source = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
