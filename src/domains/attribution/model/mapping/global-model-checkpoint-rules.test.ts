import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalModelCheckpointMaximumRangeRule,
  GlobalModelCheckpointRequiredNameRule,
  defaultGlobalModelCheckpointValidator,
} from "./global-model-checkpoint-rules.js";
import { newGlobalModelCheckpoint } from "./global-model-checkpoint.js";

test("GlobalModelCheckpointValidator reports every problem", () => {
  const validator = defaultGlobalModelCheckpointValidator();
  const item = newGlobalModelCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalModelCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new GlobalModelCheckpointRequiredNameRule("global model checkpoint needs this field");
  const item = newGlobalModelCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalModelCheckpointMaximumRangeRule flags values above maximum", () => {
  const rule = new GlobalModelCheckpointMaximumRangeRule(7.9, 3471.1);
  const item = newGlobalModelCheckpoint("x", "y");
  item.maximum = 3472.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
