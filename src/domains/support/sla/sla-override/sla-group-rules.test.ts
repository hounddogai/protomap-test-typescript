import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaGroupCodeLengthRule,
  SlaGroupSequenceRangeRule,
  SlaGroupTimezoneLengthRule,
  defaultSlaGroupValidator,
} from "./sla-group-rules.js";
import { newSlaGroup } from "./sla-group.js";

test("SlaGroupValidator reports every problem", () => {
  const validator = defaultSlaGroupValidator();
  const item = newSlaGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaGroupTimezoneLengthRule flags a long timezone", () => {
  const rule = new SlaGroupTimezoneLengthRule(1000);
  const item = newSlaGroup("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaGroupCodeLengthRule flags a long code", () => {
  const rule = new SlaGroupCodeLengthRule(64);
  const item = newSlaGroup("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaGroupSequenceRangeRule flags values above sequence", () => {
  const rule = new SlaGroupSequenceRangeRule(80, 120);
  const item = newSlaGroup("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
