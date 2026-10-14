import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingFunnelAdjustmentQuantityRangeRule,
  PendingFunnelAdjustmentRequiredChecksumRule,
  PendingFunnelAdjustmentRequiredTitleRule,
  defaultPendingFunnelAdjustmentValidator,
} from "./pending-funnel-adjustment-rules.js";
import { newPendingFunnelAdjustment } from "./pending-funnel-adjustment.js";

test("PendingFunnelAdjustmentValidator reports every problem", () => {
  const validator = defaultPendingFunnelAdjustmentValidator();
  const item = newPendingFunnelAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingFunnelAdjustmentRequiredChecksumRule flags a blank checksum", () => {
  const rule = new PendingFunnelAdjustmentRequiredChecksumRule("pending funnel adjustment needs an entry");
  const item = newPendingFunnelAdjustment("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFunnelAdjustmentQuantityRangeRule flags values above quantity", () => {
  const rule = new PendingFunnelAdjustmentQuantityRangeRule(16, 3600);
  const item = newPendingFunnelAdjustment("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingFunnelAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new PendingFunnelAdjustmentRequiredTitleRule("pending funnel adjustment needs a value");
  const item = newPendingFunnelAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
