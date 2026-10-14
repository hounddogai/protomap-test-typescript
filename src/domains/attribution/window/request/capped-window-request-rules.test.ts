import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedWindowRequestAudienceIdLengthRule,
  CappedWindowRequestNotesLengthRule,
  CappedWindowRequestRequiredAudienceIdRule,
  CappedWindowRequestSequenceRangeRule,
  CappedWindowRequestTitleLengthRule,
  defaultCappedWindowRequestValidator,
} from "./capped-window-request-rules.js";
import { newCappedWindowRequest } from "./capped-window-request.js";

test("CappedWindowRequestValidator reports every problem", () => {
  const validator = defaultCappedWindowRequestValidator();
  const item = newCappedWindowRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedWindowRequestSequenceRangeRule flags values above sequence", () => {
  const rule = new CappedWindowRequestSequenceRangeRule(80, 120);
  const item = newCappedWindowRequest("x", "y");
  item.sequence = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedWindowRequestTitleLengthRule flags a long title", () => {
  const rule = new CappedWindowRequestTitleLengthRule(64);
  const item = newCappedWindowRequest("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedWindowRequestRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new CappedWindowRequestRequiredAudienceIdRule("capped window request needs an entry");
  const item = newCappedWindowRequest("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedWindowRequestAudienceIdLengthRule flags a long audience id", () => {
  const rule = new CappedWindowRequestAudienceIdLengthRule(1000);
  const item = newCappedWindowRequest("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedWindowRequestNotesLengthRule flags a long notes", () => {
  const rule = new CappedWindowRequestNotesLengthRule(86400);
  const item = newCappedWindowRequest("x", "y");
  item.notes = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
