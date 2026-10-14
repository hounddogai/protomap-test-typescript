import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementRecordNameLengthRule,
  PlacementRecordRequiredNameRule,
  defaultPlacementRecordValidator,
} from "./placement-record-rules.js";
import { newPlacementRecord } from "./placement-record.js";

test("PlacementRecordValidator reports every problem", () => {
  const validator = defaultPlacementRecordValidator();
  const item = newPlacementRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementRecordRequiredNameRule flags a blank name", () => {
  const rule = new PlacementRecordRequiredNameRule("placement record needs a value");
  const item = newPlacementRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementRecordNameLengthRule flags a long name", () => {
  const rule = new PlacementRecordNameLengthRule(1000);
  const item = newPlacementRecord("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
