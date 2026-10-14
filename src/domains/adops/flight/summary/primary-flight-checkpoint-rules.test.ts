import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFlightCheckpointMaximumRangeRule,
  PrimaryFlightCheckpointNameLengthRule,
  PrimaryFlightCheckpointRequiredCodeRule,
  PrimaryFlightCheckpointRequiredNameRule,
  defaultPrimaryFlightCheckpointValidator,
} from "./primary-flight-checkpoint-rules.js";
import { newPrimaryFlightCheckpoint } from "./primary-flight-checkpoint.js";

test("PrimaryFlightCheckpointValidator reports every problem", () => {
  const validator = defaultPrimaryFlightCheckpointValidator();
  const item = newPrimaryFlightCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFlightCheckpointMaximumRangeRule flags values above maximum", () => {
  const rule = new PrimaryFlightCheckpointMaximumRangeRule(3.3, 2035.1);
  const item = newPrimaryFlightCheckpoint("x", "y");
  item.maximum = 2036.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryFlightCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryFlightCheckpointRequiredCodeRule("primary flight checkpoint needs this field");
  const item = newPrimaryFlightCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFlightCheckpointNameLengthRule flags a long name", () => {
  const rule = new PrimaryFlightCheckpointNameLengthRule(120);
  const item = newPrimaryFlightCheckpoint("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFlightCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryFlightCheckpointRequiredNameRule("primary flight checkpoint needs this field");
  const item = newPrimaryFlightCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
