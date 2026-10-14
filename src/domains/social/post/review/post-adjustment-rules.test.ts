import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostAdjustmentRequiredUtmSourceRule,
  PostAdjustmentTitleLengthRule,
  defaultPostAdjustmentValidator,
} from "./post-adjustment-rules.js";
import { newPostAdjustment } from "./post-adjustment.js";

test("PostAdjustmentValidator reports every problem", () => {
  const validator = defaultPostAdjustmentValidator();
  const item = newPostAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostAdjustmentRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PostAdjustmentRequiredUtmSourceRule("post adjustment needs an entry");
  const item = newPostAdjustment("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new PostAdjustmentTitleLengthRule(3600);
  const item = newPostAdjustment("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
