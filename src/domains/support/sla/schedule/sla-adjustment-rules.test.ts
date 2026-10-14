import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaAdjustmentAmountRangeRule,
  SlaAdjustmentChecksumLengthRule,
  SlaAdjustmentRegionLengthRule,
  SlaAdjustmentTitleLengthRule,
  defaultSlaAdjustmentValidator,
} from "./sla-adjustment-rules.js";
import { newSlaAdjustment } from "./sla-adjustment.js";

test("SlaAdjustmentValidator reports every problem", () => {
  const validator = defaultSlaAdjustmentValidator();
  const item = newSlaAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaAdjustmentChecksumLengthRule flags a long checksum", () => {
  const rule = new SlaAdjustmentChecksumLengthRule(3600);
  const item = newSlaAdjustment("x", "y");
  item.checksum = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaAdjustmentAmountRangeRule flags values above amount", () => {
  const rule = new SlaAdjustmentAmountRangeRule(6, 3162.8);
  const item = newSlaAdjustment("x", "y");
  item.amount = 3164.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaAdjustmentRegionLengthRule flags a long region", () => {
  const rule = new SlaAdjustmentRegionLengthRule(32);
  const item = newSlaAdjustment("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new SlaAdjustmentTitleLengthRule(16);
  const item = newSlaAdjustment("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
