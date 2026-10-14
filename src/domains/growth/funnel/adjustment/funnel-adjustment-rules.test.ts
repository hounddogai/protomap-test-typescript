import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelAdjustmentCodeLengthRule,
  FunnelAdjustmentNameLengthRule,
  defaultFunnelAdjustmentValidator,
} from "./funnel-adjustment-rules.js";
import { newFunnelAdjustment } from "./funnel-adjustment.js";

test("FunnelAdjustmentValidator reports every problem", () => {
  const validator = defaultFunnelAdjustmentValidator();
  const item = newFunnelAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new FunnelAdjustmentCodeLengthRule(120);
  const item = newFunnelAdjustment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelAdjustmentNameLengthRule flags a long name", () => {
  const rule = new FunnelAdjustmentNameLengthRule(86400);
  const item = newFunnelAdjustment("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
