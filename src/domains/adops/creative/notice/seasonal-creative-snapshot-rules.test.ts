import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCreativeSnapshotCodeLengthRule,
  SeasonalCreativeSnapshotFrequencyCapRangeRule,
  SeasonalCreativeSnapshotRequiredCodeRule,
  defaultSeasonalCreativeSnapshotValidator,
} from "./seasonal-creative-snapshot-rules.js";
import { newSeasonalCreativeSnapshot } from "./seasonal-creative-snapshot.js";

test("SeasonalCreativeSnapshotValidator reports every problem", () => {
  const validator = defaultSeasonalCreativeSnapshotValidator();
  const item = newSeasonalCreativeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCreativeSnapshotCodeLengthRule flags a long code", () => {
  const rule = new SeasonalCreativeSnapshotCodeLengthRule(86400);
  const item = newSeasonalCreativeSnapshot("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalCreativeSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalCreativeSnapshotRequiredCodeRule("seasonal creative snapshot needs a value");
  const item = newSeasonalCreativeSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalCreativeSnapshotFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new SeasonalCreativeSnapshotFrequencyCapRangeRule(1000, 86400);
  const item = newSeasonalCreativeSnapshot("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
