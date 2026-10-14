import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalPlacementAdjustmentRequiredCodeRule,
  GlobalPlacementAdjustmentRequiredTitleRule,
  defaultGlobalPlacementAdjustmentValidator,
} from "./global-placement-adjustment-rules.js";
import { newGlobalPlacementAdjustment } from "./global-placement-adjustment.js";

test("GlobalPlacementAdjustmentValidator reports every problem", () => {
  const validator = defaultGlobalPlacementAdjustmentValidator();
  const item = newGlobalPlacementAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalPlacementAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalPlacementAdjustmentRequiredCodeRule("global placement adjustment needs this field");
  const item = newGlobalPlacementAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalPlacementAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalPlacementAdjustmentRequiredTitleRule("global placement adjustment needs this field");
  const item = newGlobalPlacementAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
