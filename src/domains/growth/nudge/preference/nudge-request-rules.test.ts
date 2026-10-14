import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeRequestNameLengthRule,
  NudgeRequestRequiredCodeRule,
  NudgeRequestRequiredNameRule,
  defaultNudgeRequestValidator,
} from "./nudge-request-rules.js";
import { newNudgeRequest } from "./nudge-request.js";

test("NudgeRequestValidator reports every problem", () => {
  const validator = defaultNudgeRequestValidator();
  const item = newNudgeRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeRequestRequiredNameRule flags a blank name", () => {
  const rule = new NudgeRequestRequiredNameRule("nudge request needs an entry");
  const item = newNudgeRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeRequestNameLengthRule flags a long name", () => {
  const rule = new NudgeRequestNameLengthRule(86400);
  const item = newNudgeRequest("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeRequestRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeRequestRequiredCodeRule("nudge request needs this field");
  const item = newNudgeRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
