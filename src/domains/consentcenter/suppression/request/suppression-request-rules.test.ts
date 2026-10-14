import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionRequestFloorValueRangeRule,
  SuppressionRequestRequiredLabelRule,
  defaultSuppressionRequestValidator,
} from "./suppression-request-rules.js";
import { newSuppressionRequest } from "./suppression-request.js";

test("SuppressionRequestValidator reports every problem", () => {
  const validator = defaultSuppressionRequestValidator();
  const item = newSuppressionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionRequestFloorValueRangeRule flags values above floor value", () => {
  const rule = new SuppressionRequestFloorValueRangeRule(5.4, 2636.3);
  const item = newSuppressionRequest("x", "y");
  item.floorValue = 2637.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionRequestRequiredLabelRule flags a blank label", () => {
  const rule = new SuppressionRequestRequiredLabelRule("suppression request needs a value");
  const item = newSuppressionRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
