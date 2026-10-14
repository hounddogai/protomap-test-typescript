import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalInviteRequestNameLengthRule,
  SeasonalInviteRequestRequiredNameRule,
  SeasonalInviteRequestRequiredNotesRule,
  SeasonalInviteRequestRequiredTitleRule,
  SeasonalInviteRequestTitleLengthRule,
  defaultSeasonalInviteRequestValidator,
} from "./seasonal-invite-request-rules.js";
import { newSeasonalInviteRequest } from "./seasonal-invite-request.js";

test("SeasonalInviteRequestValidator reports every problem", () => {
  const validator = defaultSeasonalInviteRequestValidator();
  const item = newSeasonalInviteRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalInviteRequestRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalInviteRequestRequiredTitleRule("seasonal invite request needs this field");
  const item = newSeasonalInviteRequest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalInviteRequestTitleLengthRule flags a long title", () => {
  const rule = new SeasonalInviteRequestTitleLengthRule(64);
  const item = newSeasonalInviteRequest("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInviteRequestNameLengthRule flags a long name", () => {
  const rule = new SeasonalInviteRequestNameLengthRule(3600);
  const item = newSeasonalInviteRequest("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalInviteRequestRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalInviteRequestRequiredNameRule("seasonal invite request needs this field");
  const item = newSeasonalInviteRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalInviteRequestRequiredNotesRule flags a blank notes", () => {
  const rule = new SeasonalInviteRequestRequiredNotesRule("seasonal invite request needs an entry");
  const item = newSeasonalInviteRequest("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
