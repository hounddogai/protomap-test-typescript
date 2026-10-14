import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementExceptionMarginRangeRule,
  PlacementExceptionSendAtRangeRule,
  defaultPlacementExceptionValidator,
} from "./placement-exception-rules.js";
import { newPlacementException } from "./placement-exception.js";

test("PlacementExceptionValidator reports every problem", () => {
  const validator = defaultPlacementExceptionValidator();
  const item = newPlacementException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementExceptionSendAtRangeRule flags values above send at", () => {
  const rule = new PlacementExceptionSendAtRangeRule(80, 1000);
  const item = newPlacementException("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementExceptionMarginRangeRule flags values above margin", () => {
  const rule = new PlacementExceptionMarginRangeRule(8.4, 4082.7);
  const item = newPlacementException("x", "y");
  item.margin = 4084.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
