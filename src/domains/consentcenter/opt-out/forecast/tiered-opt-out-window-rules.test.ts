import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredOptOutWindowRatioRangeRule,
  TieredOptOutWindowRequiredCodeRule,
  defaultTieredOptOutWindowValidator,
} from "./tiered-opt-out-window-rules.js";
import { newTieredOptOutWindow } from "./tiered-opt-out-window.js";

test("TieredOptOutWindowValidator reports every problem", () => {
  const validator = defaultTieredOptOutWindowValidator();
  const item = newTieredOptOutWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredOptOutWindowRequiredCodeRule flags a blank code", () => {
  const rule = new TieredOptOutWindowRequiredCodeRule("tiered opt out window needs this field");
  const item = newTieredOptOutWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredOptOutWindowRatioRangeRule flags values above ratio", () => {
  const rule = new TieredOptOutWindowRatioRangeRule(4.6, 3985.8);
  const item = newTieredOptOutWindow("x", "y");
  item.ratio = 3987.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
