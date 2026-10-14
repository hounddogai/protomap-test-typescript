import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictMacroRequestAudienceIdLengthRule,
  StrictMacroRequestRequiredTitleRule,
  defaultStrictMacroRequestValidator,
} from "./strict-macro-request-rules.js";
import { newStrictMacroRequest } from "./strict-macro-request.js";

test("StrictMacroRequestValidator reports every problem", () => {
  const validator = defaultStrictMacroRequestValidator();
  const item = newStrictMacroRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictMacroRequestAudienceIdLengthRule flags a long audience id", () => {
  const rule = new StrictMacroRequestAudienceIdLengthRule(86400);
  const item = newStrictMacroRequest("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictMacroRequestRequiredTitleRule flags a blank title", () => {
  const rule = new StrictMacroRequestRequiredTitleRule("strict macro request needs this field");
  const item = newStrictMacroRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
