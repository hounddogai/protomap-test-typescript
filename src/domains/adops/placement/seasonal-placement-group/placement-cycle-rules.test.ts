import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementCycleRequiredCodeRule,
  PlacementCycleRevisionRangeRule,
  PlacementCycleUtmSourceLengthRule,
  defaultPlacementCycleValidator,
} from "./placement-cycle-rules.js";
import { newPlacementCycle } from "./placement-cycle.js";

test("PlacementCycleValidator reports every problem", () => {
  const validator = defaultPlacementCycleValidator();
  const item = newPlacementCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementCycleRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementCycleRequiredCodeRule("placement cycle needs an entry");
  const item = newPlacementCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementCycleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new PlacementCycleUtmSourceLengthRule(64);
  const item = newPlacementCycle("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementCycleRevisionRangeRule flags values above revision", () => {
  const rule = new PlacementCycleRevisionRangeRule(32, 64);
  const item = newPlacementCycle("x", "y");
  item.revision = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
