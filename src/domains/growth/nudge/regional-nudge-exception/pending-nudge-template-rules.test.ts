import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingNudgeTemplateAudienceIdLengthRule,
  PendingNudgeTemplateRequiredCodeRule,
  PendingNudgeTemplateTitleLengthRule,
  defaultPendingNudgeTemplateValidator,
} from "./pending-nudge-template-rules.js";
import { newPendingNudgeTemplate } from "./pending-nudge-template.js";

test("PendingNudgeTemplateValidator reports every problem", () => {
  const validator = defaultPendingNudgeTemplateValidator();
  const item = newPendingNudgeTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingNudgeTemplateAudienceIdLengthRule flags a long audience id", () => {
  const rule = new PendingNudgeTemplateAudienceIdLengthRule(80);
  const item = newPendingNudgeTemplate("x", "y");
  item.audienceId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingNudgeTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new PendingNudgeTemplateRequiredCodeRule("pending nudge template needs this field");
  const item = newPendingNudgeTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingNudgeTemplateTitleLengthRule flags a long title", () => {
  const rule = new PendingNudgeTemplateTitleLengthRule(1000);
  const item = newPendingNudgeTemplate("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
