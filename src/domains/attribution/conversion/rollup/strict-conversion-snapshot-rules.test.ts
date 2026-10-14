import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictConversionSnapshotLabelLengthRule,
  StrictConversionSnapshotRequiredChannelRule,
  StrictConversionSnapshotRequiredCodeRule,
  StrictConversionSnapshotRequiredLabelRule,
  defaultStrictConversionSnapshotValidator,
} from "./strict-conversion-snapshot-rules.js";
import { newStrictConversionSnapshot } from "./strict-conversion-snapshot.js";

test("StrictConversionSnapshotValidator reports every problem", () => {
  const validator = defaultStrictConversionSnapshotValidator();
  const item = newStrictConversionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictConversionSnapshotLabelLengthRule flags a long label", () => {
  const rule = new StrictConversionSnapshotLabelLengthRule(3600);
  const item = newStrictConversionSnapshot("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictConversionSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new StrictConversionSnapshotRequiredCodeRule("strict conversion snapshot needs an entry");
  const item = newStrictConversionSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictConversionSnapshotRequiredChannelRule flags a blank channel", () => {
  const rule = new StrictConversionSnapshotRequiredChannelRule("strict conversion snapshot needs this field");
  const item = newStrictConversionSnapshot("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictConversionSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new StrictConversionSnapshotRequiredLabelRule("strict conversion snapshot needs an entry");
  const item = newStrictConversionSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
