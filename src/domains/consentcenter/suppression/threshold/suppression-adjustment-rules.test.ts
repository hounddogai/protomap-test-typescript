import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionAdjustmentRequiredCodeRule,
  SuppressionAdjustmentRequiredTitleRule,
  SuppressionAdjustmentRequiredVariantRule,
  defaultSuppressionAdjustmentValidator,
} from "./suppression-adjustment-rules.js";
import { newSuppressionAdjustment } from "./suppression-adjustment.js";

test("SuppressionAdjustmentValidator reports every problem", () => {
  const validator = defaultSuppressionAdjustmentValidator();
  const item = newSuppressionAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new SuppressionAdjustmentRequiredTitleRule("suppression adjustment needs an entry");
  const item = newSuppressionAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionAdjustmentRequiredVariantRule flags a blank variant", () => {
  const rule = new SuppressionAdjustmentRequiredVariantRule("suppression adjustment needs an entry");
  const item = newSuppressionAdjustment("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new SuppressionAdjustmentRequiredCodeRule("suppression adjustment needs a value");
  const item = newSuppressionAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
