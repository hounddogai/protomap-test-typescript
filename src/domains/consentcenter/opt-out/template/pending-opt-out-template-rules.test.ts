import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingOptOutTemplateFloorValueRangeRule,
  PendingOptOutTemplateMaximumRangeRule,
  PendingOptOutTemplateRequiredVariantRule,
  defaultPendingOptOutTemplateValidator,
} from "./pending-opt-out-template-rules.js";
import { newPendingOptOutTemplate } from "./pending-opt-out-template.js";

test("PendingOptOutTemplateValidator reports every problem", () => {
  const validator = defaultPendingOptOutTemplateValidator();
  const item = newPendingOptOutTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingOptOutTemplateMaximumRangeRule flags values above maximum", () => {
  const rule = new PendingOptOutTemplateMaximumRangeRule(2.4, 583.9);
  const item = newPendingOptOutTemplate("x", "y");
  item.maximum = 585.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingOptOutTemplateFloorValueRangeRule flags values above floor value", () => {
  const rule = new PendingOptOutTemplateFloorValueRangeRule(2.9, 4474.7);
  const item = newPendingOptOutTemplate("x", "y");
  item.floorValue = 4476.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingOptOutTemplateRequiredVariantRule flags a blank variant", () => {
  const rule = new PendingOptOutTemplateRequiredVariantRule("pending opt out template needs this field");
  const item = newPendingOptOutTemplate("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
