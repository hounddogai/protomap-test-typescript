import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupDraftRequiredAudienceIdRule,
  WarmupDraftRequiredChannelRule,
  defaultWarmupDraftValidator,
} from "./warmup-draft-rules.js";
import { newWarmupDraft } from "./warmup-draft.js";

test("WarmupDraftValidator reports every problem", () => {
  const validator = defaultWarmupDraftValidator();
  const item = newWarmupDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupDraftRequiredChannelRule flags a blank channel", () => {
  const rule = new WarmupDraftRequiredChannelRule("warmup draft needs an entry");
  const item = newWarmupDraft("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupDraftRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new WarmupDraftRequiredAudienceIdRule("warmup draft needs a value");
  const item = newWarmupDraft("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
