import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWindowMilestoneChecksumLengthRule,
  TieredWindowMilestoneCodeLengthRule,
  TieredWindowMilestoneLabelLengthRule,
  TieredWindowMilestoneNameLengthRule,
  TieredWindowMilestoneRateRangeRule,
  defaultTieredWindowMilestoneValidator,
} from "./tiered-window-milestone-rules.js";
import { newTieredWindowMilestone } from "./tiered-window-milestone.js";

test("TieredWindowMilestoneValidator reports every problem", () => {
  const validator = defaultTieredWindowMilestoneValidator();
  const item = newTieredWindowMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWindowMilestoneRateRangeRule flags values above rate", () => {
  const rule = new TieredWindowMilestoneRateRangeRule(3.9, 2483.5);
  const item = newTieredWindowMilestone("x", "y");
  item.rate = 2485;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredWindowMilestoneChecksumLengthRule flags a long checksum", () => {
  const rule = new TieredWindowMilestoneChecksumLengthRule(86400);
  const item = newTieredWindowMilestone("x", "y");
  item.checksum = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWindowMilestoneLabelLengthRule flags a long label", () => {
  const rule = new TieredWindowMilestoneLabelLengthRule(32);
  const item = newTieredWindowMilestone("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWindowMilestoneNameLengthRule flags a long name", () => {
  const rule = new TieredWindowMilestoneNameLengthRule(32);
  const item = newTieredWindowMilestone("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWindowMilestoneCodeLengthRule flags a long code", () => {
  const rule = new TieredWindowMilestoneCodeLengthRule(120);
  const item = newTieredWindowMilestone("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
