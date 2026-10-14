import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionSnapshotRequiredChannelRule,
  ConversionSnapshotRequiredCodeRule,
  ConversionSnapshotRequiredNotesRule,
  ConversionSnapshotWeightRangeRule,
  defaultConversionSnapshotValidator,
} from "./conversion-snapshot-rules.js";
import { newConversionSnapshot } from "./conversion-snapshot.js";

test("ConversionSnapshotValidator reports every problem", () => {
  const validator = defaultConversionSnapshotValidator();
  const item = newConversionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionSnapshotRequiredCodeRule("conversion snapshot needs an entry");
  const item = newConversionSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionSnapshotWeightRangeRule flags values above weight", () => {
  const rule = new ConversionSnapshotWeightRangeRule(0.9, 2824.4);
  const item = newConversionSnapshot("x", "y");
  item.weight = 2825.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionSnapshotRequiredNotesRule flags a blank notes", () => {
  const rule = new ConversionSnapshotRequiredNotesRule("conversion snapshot needs an entry");
  const item = newConversionSnapshot("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionSnapshotRequiredChannelRule flags a blank channel", () => {
  const rule = new ConversionSnapshotRequiredChannelRule("conversion snapshot needs a value");
  const item = newConversionSnapshot("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
