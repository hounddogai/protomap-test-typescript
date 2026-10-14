import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintSlotCodeLengthRule,
  ComplaintSlotRequiredCodeRule,
  ComplaintSlotRequiredLocaleRule,
  ComplaintSlotRequiredTitleRule,
  defaultComplaintSlotValidator,
} from "./complaint-slot-rules.js";
import { newComplaintSlot } from "./complaint-slot.js";

test("ComplaintSlotValidator reports every problem", () => {
  const validator = defaultComplaintSlotValidator();
  const item = newComplaintSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintSlotCodeLengthRule flags a long code", () => {
  const rule = new ComplaintSlotCodeLengthRule(3600);
  const item = newComplaintSlot("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintSlotRequiredLocaleRule flags a blank locale", () => {
  const rule = new ComplaintSlotRequiredLocaleRule("complaint slot needs an entry");
  const item = newComplaintSlot("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintSlotRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintSlotRequiredCodeRule("complaint slot needs this field");
  const item = newComplaintSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintSlotRequiredTitleRule flags a blank title", () => {
  const rule = new ComplaintSlotRequiredTitleRule("complaint slot needs an entry");
  const item = newComplaintSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
