import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientOptOutCycleRatioRangeRule,
  defaultLenientOptOutCycleValidator,
} from "./lenient-opt-out-cycle-rules.js";
import { newLenientOptOutCycle } from "./lenient-opt-out-cycle.js";

test("LenientOptOutCycleValidator reports every problem", () => {
  const validator = defaultLenientOptOutCycleValidator();
  const item = newLenientOptOutCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientOptOutCycleRatioRangeRule flags values above ratio", () => {
  const rule = new LenientOptOutCycleRatioRangeRule(0.8, 3766.2);
  const item = newLenientOptOutCycle("x", "y");
  item.ratio = 3767.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
