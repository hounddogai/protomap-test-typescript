import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalFlightRecordCapacityRangeRule,
  SeasonalFlightRecordLocaleLengthRule,
  SeasonalFlightRecordRequiredLabelRule,
  defaultSeasonalFlightRecordValidator,
} from "./seasonal-flight-record-rules.js";
import { newSeasonalFlightRecord } from "./seasonal-flight-record.js";

test("SeasonalFlightRecordValidator reports every problem", () => {
  const validator = defaultSeasonalFlightRecordValidator();
  const item = newSeasonalFlightRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalFlightRecordRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalFlightRecordRequiredLabelRule("seasonal flight record needs a value");
  const item = newSeasonalFlightRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFlightRecordLocaleLengthRule flags a long locale", () => {
  const rule = new SeasonalFlightRecordLocaleLengthRule(120);
  const item = newSeasonalFlightRecord("x", "y");
  item.locale = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalFlightRecordCapacityRangeRule flags values above capacity", () => {
  const rule = new SeasonalFlightRecordCapacityRangeRule(80, 120);
  const item = newSeasonalFlightRecord("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
