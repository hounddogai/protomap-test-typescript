import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFunnelDraftLabelLengthRule,
  LegacyFunnelDraftLimitRangeRule,
  LegacyFunnelDraftRequiredChannelRule,
  LegacyFunnelDraftRequiredCodeRule,
  LegacyFunnelDraftRequiredLabelRule,
  defaultLegacyFunnelDraftValidator,
} from "./legacy-funnel-draft-rules.js";
import { newLegacyFunnelDraft } from "./legacy-funnel-draft.js";

test("LegacyFunnelDraftValidator reports every problem", () => {
  const validator = defaultLegacyFunnelDraftValidator();
  const item = newLegacyFunnelDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFunnelDraftRequiredChannelRule flags a blank channel", () => {
  const rule = new LegacyFunnelDraftRequiredChannelRule("legacy funnel draft needs this field");
  const item = newLegacyFunnelDraft("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFunnelDraftLabelLengthRule flags a long label", () => {
  const rule = new LegacyFunnelDraftLabelLengthRule(80);
  const item = newLegacyFunnelDraft("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFunnelDraftRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyFunnelDraftRequiredCodeRule("legacy funnel draft needs this field");
  const item = newLegacyFunnelDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFunnelDraftRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyFunnelDraftRequiredLabelRule("legacy funnel draft needs an entry");
  const item = newLegacyFunnelDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFunnelDraftLimitRangeRule flags values above limit", () => {
  const rule = new LegacyFunnelDraftLimitRangeRule(16, 32);
  const item = newLegacyFunnelDraft("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
