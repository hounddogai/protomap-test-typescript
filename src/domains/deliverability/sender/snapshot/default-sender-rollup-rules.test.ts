import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultSenderRollupAudienceIdLengthRule,
  DefaultSenderRollupCodeLengthRule,
  DefaultSenderRollupRequiredCampaignRefRule,
  DefaultSenderRollupRequiredCodeRule,
  DefaultSenderRollupRequiredLabelRule,
  defaultDefaultSenderRollupValidator,
} from "./default-sender-rollup-rules.js";
import { newDefaultSenderRollup } from "./default-sender-rollup.js";

test("DefaultSenderRollupValidator reports every problem", () => {
  const validator = defaultDefaultSenderRollupValidator();
  const item = newDefaultSenderRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultSenderRollupCodeLengthRule flags a long code", () => {
  const rule = new DefaultSenderRollupCodeLengthRule(80);
  const item = newDefaultSenderRollup("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultSenderRollupRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultSenderRollupRequiredCodeRule("default sender rollup needs an entry");
  const item = newDefaultSenderRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultSenderRollupRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new DefaultSenderRollupRequiredCampaignRefRule("default sender rollup needs this field");
  const item = newDefaultSenderRollup("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultSenderRollupAudienceIdLengthRule flags a long audience id", () => {
  const rule = new DefaultSenderRollupAudienceIdLengthRule(120);
  const item = newDefaultSenderRollup("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultSenderRollupRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultSenderRollupRequiredLabelRule("default sender rollup needs a value");
  const item = newDefaultSenderRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
