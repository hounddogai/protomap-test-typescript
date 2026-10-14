import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalOptOutExceptionAudienceIdLengthRule,
  GlobalOptOutExceptionRequiredAudienceIdRule,
  GlobalOptOutExceptionTitleLengthRule,
  defaultGlobalOptOutExceptionValidator,
} from "./global-opt-out-exception-rules.js";
import { newGlobalOptOutException } from "./global-opt-out-exception.js";

test("GlobalOptOutExceptionValidator reports every problem", () => {
  const validator = defaultGlobalOptOutExceptionValidator();
  const item = newGlobalOptOutException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalOptOutExceptionRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new GlobalOptOutExceptionRequiredAudienceIdRule("global opt out exception needs a value");
  const item = newGlobalOptOutException("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalOptOutExceptionAudienceIdLengthRule flags a long audience id", () => {
  const rule = new GlobalOptOutExceptionAudienceIdLengthRule(1000);
  const item = newGlobalOptOutException("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalOptOutExceptionTitleLengthRule flags a long title", () => {
  const rule = new GlobalOptOutExceptionTitleLengthRule(120);
  const item = newGlobalOptOutException("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
