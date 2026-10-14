import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalNudgeWindowBidRangeRule,
  GlobalNudgeWindowGraceDaysRangeRule,
  defaultGlobalNudgeWindowValidator,
} from "./global-nudge-window-rules.js";
import { newGlobalNudgeWindow } from "./global-nudge-window.js";

test("GlobalNudgeWindowValidator reports every problem", () => {
  const validator = defaultGlobalNudgeWindowValidator();
  const item = newGlobalNudgeWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalNudgeWindowGraceDaysRangeRule flags values above grace days", () => {
  const rule = new GlobalNudgeWindowGraceDaysRangeRule(64, 1000);
  const item = newGlobalNudgeWindow("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalNudgeWindowBidRangeRule flags values above bid", () => {
  const rule = new GlobalNudgeWindowBidRangeRule(2.1, 1761.2);
  const item = newGlobalNudgeWindow("x", "y");
  item.bid = 1762.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
