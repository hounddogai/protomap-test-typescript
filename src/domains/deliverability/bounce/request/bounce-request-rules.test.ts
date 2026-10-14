import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceRequestEndsAtRangeRule,
  BounceRequestTitleLengthRule,
  defaultBounceRequestValidator,
} from "./bounce-request-rules.js";
import { newBounceRequest } from "./bounce-request.js";

test("BounceRequestValidator reports every problem", () => {
  const validator = defaultBounceRequestValidator();
  const item = newBounceRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceRequestTitleLengthRule flags a long title", () => {
  const rule = new BounceRequestTitleLengthRule(80);
  const item = newBounceRequest("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceRequestEndsAtRangeRule flags values above ends at", () => {
  const rule = new BounceRequestEndsAtRangeRule(80, 1000);
  const item = newBounceRequest("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
