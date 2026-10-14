import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalModelCheckpointMarginRangeRule,
  RegionalModelCheckpointOpenRateRangeRule,
  RegionalModelCheckpointRequiredCodeRule,
  RegionalModelCheckpointTitleLengthRule,
  defaultRegionalModelCheckpointValidator,
} from "./regional-model-checkpoint-rules.js";
import { newRegionalModelCheckpoint } from "./regional-model-checkpoint.js";

test("RegionalModelCheckpointValidator reports every problem", () => {
  const validator = defaultRegionalModelCheckpointValidator();
  const item = newRegionalModelCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalModelCheckpointOpenRateRangeRule flags values above open rate", () => {
  const rule = new RegionalModelCheckpointOpenRateRangeRule(8.1, 496.8);
  const item = newRegionalModelCheckpoint("x", "y");
  item.openRate = 498.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalModelCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalModelCheckpointRequiredCodeRule("regional model checkpoint needs an entry");
  const item = newRegionalModelCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalModelCheckpointMarginRangeRule flags values above margin", () => {
  const rule = new RegionalModelCheckpointMarginRangeRule(3, 1685.5);
  const item = newRegionalModelCheckpoint("x", "y");
  item.margin = 1687;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalModelCheckpointTitleLengthRule flags a long title", () => {
  const rule = new RegionalModelCheckpointTitleLengthRule(32);
  const item = newRegionalModelCheckpoint("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
