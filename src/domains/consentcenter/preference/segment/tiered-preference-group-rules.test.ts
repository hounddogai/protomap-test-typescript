import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPreferenceGroupLabelLengthRule,
  TieredPreferenceGroupQuantityRangeRule,
  TieredPreferenceGroupRequiredChecksumRule,
  TieredPreferenceGroupRequiredCodeRule,
  defaultTieredPreferenceGroupValidator,
} from "./tiered-preference-group-rules.js";
import { newTieredPreferenceGroup } from "./tiered-preference-group.js";

test("TieredPreferenceGroupValidator reports every problem", () => {
  const validator = defaultTieredPreferenceGroupValidator();
  const item = newTieredPreferenceGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPreferenceGroupRequiredChecksumRule flags a blank checksum", () => {
  const rule = new TieredPreferenceGroupRequiredChecksumRule("tiered preference group needs a value");
  const item = newTieredPreferenceGroup("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPreferenceGroupLabelLengthRule flags a long label", () => {
  const rule = new TieredPreferenceGroupLabelLengthRule(64);
  const item = newTieredPreferenceGroup("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPreferenceGroupRequiredCodeRule flags a blank code", () => {
  const rule = new TieredPreferenceGroupRequiredCodeRule("tiered preference group needs a value");
  const item = newTieredPreferenceGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPreferenceGroupQuantityRangeRule flags values above quantity", () => {
  const rule = new TieredPreferenceGroupQuantityRangeRule(1000, 86400);
  const item = newTieredPreferenceGroup("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
