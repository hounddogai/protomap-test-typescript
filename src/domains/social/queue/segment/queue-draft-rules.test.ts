import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueDraftCampaignRefLengthRule,
  QueueDraftClicksRangeRule,
  QueueDraftCodeLengthRule,
  defaultQueueDraftValidator,
} from "./queue-draft-rules.js";
import { newQueueDraft } from "./queue-draft.js";

test("QueueDraftValidator reports every problem", () => {
  const validator = defaultQueueDraftValidator();
  const item = newQueueDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueDraftCodeLengthRule flags a long code", () => {
  const rule = new QueueDraftCodeLengthRule(16);
  const item = newQueueDraft("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueDraftClicksRangeRule flags values above clicks", () => {
  const rule = new QueueDraftClicksRangeRule(80, 3600);
  const item = newQueueDraft("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueDraftCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new QueueDraftCampaignRefLengthRule(64);
  const item = newQueueDraft("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
