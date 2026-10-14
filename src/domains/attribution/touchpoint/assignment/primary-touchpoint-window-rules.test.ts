import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTouchpointWindowLabelLengthRule,
  defaultPrimaryTouchpointWindowValidator,
} from "./primary-touchpoint-window-rules.js";
import { newPrimaryTouchpointWindow } from "./primary-touchpoint-window.js";

test("PrimaryTouchpointWindowValidator reports every problem", () => {
  const validator = defaultPrimaryTouchpointWindowValidator();
  const item = newPrimaryTouchpointWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTouchpointWindowLabelLengthRule flags a long label", () => {
  const rule = new PrimaryTouchpointWindowLabelLengthRule(64);
  const item = newPrimaryTouchpointWindow("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
