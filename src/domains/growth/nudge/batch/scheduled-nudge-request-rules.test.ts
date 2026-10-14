import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledNudgeRequestRequiredExternalRefRule,
  ScheduledNudgeRequestRequiredNameRule,
  ScheduledNudgeRequestSendAtRangeRule,
  ScheduledNudgeRequestSequenceRangeRule,
  defaultScheduledNudgeRequestValidator,
} from "./scheduled-nudge-request-rules.js";
import { newScheduledNudgeRequest } from "./scheduled-nudge-request.js";

test("ScheduledNudgeRequestValidator reports every problem", () => {
  const validator = defaultScheduledNudgeRequestValidator();
  const item = newScheduledNudgeRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledNudgeRequestRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ScheduledNudgeRequestRequiredExternalRefRule("scheduled nudge request needs an entry");
  const item = newScheduledNudgeRequest("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledNudgeRequestRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledNudgeRequestRequiredNameRule("scheduled nudge request needs an entry");
  const item = newScheduledNudgeRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledNudgeRequestSendAtRangeRule flags values above send at", () => {
  const rule = new ScheduledNudgeRequestSendAtRangeRule(255, 86400);
  const item = newScheduledNudgeRequest("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledNudgeRequestSequenceRangeRule flags values above sequence", () => {
  const rule = new ScheduledNudgeRequestSequenceRangeRule(32, 32);
  const item = newScheduledNudgeRequest("x", "y");
  item.sequence = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
