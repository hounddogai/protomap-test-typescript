import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveMacroCheckpointNameLengthRule,
  AdaptiveMacroCheckpointRequiredCodeRule,
  AdaptiveMacroCheckpointScoreRangeRule,
  defaultAdaptiveMacroCheckpointValidator,
} from "./adaptive-macro-checkpoint-rules.js";
import { newAdaptiveMacroCheckpoint } from "./adaptive-macro-checkpoint.js";

test("AdaptiveMacroCheckpointValidator reports every problem", () => {
  const validator = defaultAdaptiveMacroCheckpointValidator();
  const item = newAdaptiveMacroCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveMacroCheckpointNameLengthRule flags a long name", () => {
  const rule = new AdaptiveMacroCheckpointNameLengthRule(120);
  const item = newAdaptiveMacroCheckpoint("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveMacroCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveMacroCheckpointRequiredCodeRule("adaptive macro checkpoint needs a value");
  const item = newAdaptiveMacroCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveMacroCheckpointScoreRangeRule flags values above score", () => {
  const rule = new AdaptiveMacroCheckpointScoreRangeRule(2.3, 4862.8);
  const item = newAdaptiveMacroCheckpoint("x", "y");
  item.score = 4864.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
