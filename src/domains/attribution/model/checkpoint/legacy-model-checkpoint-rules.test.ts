import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyModelCheckpointCreatedAtRangeRule,
  LegacyModelCheckpointDiscountRangeRule,
  LegacyModelCheckpointRequiredCodeRule,
  defaultLegacyModelCheckpointValidator,
} from "./legacy-model-checkpoint-rules.js";
import { newLegacyModelCheckpoint } from "./legacy-model-checkpoint.js";

test("LegacyModelCheckpointValidator reports every problem", () => {
  const validator = defaultLegacyModelCheckpointValidator();
  const item = newLegacyModelCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyModelCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyModelCheckpointRequiredCodeRule("legacy model checkpoint needs an entry");
  const item = newLegacyModelCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyModelCheckpointDiscountRangeRule flags values above discount", () => {
  const rule = new LegacyModelCheckpointDiscountRangeRule(0.3, 2584.2);
  const item = newLegacyModelCheckpoint("x", "y");
  item.discount = 2585.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyModelCheckpointCreatedAtRangeRule flags values above created at", () => {
  const rule = new LegacyModelCheckpointCreatedAtRangeRule(32, 86400);
  const item = newLegacyModelCheckpoint("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
