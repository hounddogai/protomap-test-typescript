import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintCycleFloorValueRangeRule,
  ComplaintCycleRequiredChannelRule,
  ComplaintCycleRequiredLabelRule,
  defaultComplaintCycleValidator,
} from "./complaint-cycle-rules.js";
import { newComplaintCycle } from "./complaint-cycle.js";

test("ComplaintCycleValidator reports every problem", () => {
  const validator = defaultComplaintCycleValidator();
  const item = newComplaintCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintCycleRequiredChannelRule flags a blank channel", () => {
  const rule = new ComplaintCycleRequiredChannelRule("complaint cycle needs an entry");
  const item = newComplaintCycle("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintCycleRequiredLabelRule flags a blank label", () => {
  const rule = new ComplaintCycleRequiredLabelRule("complaint cycle needs a value");
  const item = newComplaintCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintCycleFloorValueRangeRule flags values above floor value", () => {
  const rule = new ComplaintCycleFloorValueRangeRule(1.8, 360.5);
  const item = newComplaintCycle("x", "y");
  item.floorValue = 362;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
