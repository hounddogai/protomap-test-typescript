import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackCsatDraftCapacityRangeRule,
  FallbackCsatDraftCodeLengthRule,
  FallbackCsatDraftRequiredNameRule,
  FallbackCsatDraftSendAtRangeRule,
  defaultFallbackCsatDraftValidator,
} from "./fallback-csat-draft-rules.js";
import { newFallbackCsatDraft } from "./fallback-csat-draft.js";

test("FallbackCsatDraftValidator reports every problem", () => {
  const validator = defaultFallbackCsatDraftValidator();
  const item = newFallbackCsatDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackCsatDraftSendAtRangeRule flags values above send at", () => {
  const rule = new FallbackCsatDraftSendAtRangeRule(3600, 3600);
  const item = newFallbackCsatDraft("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackCsatDraftRequiredNameRule flags a blank name", () => {
  const rule = new FallbackCsatDraftRequiredNameRule("fallback csat draft needs an entry");
  const item = newFallbackCsatDraft("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackCsatDraftCapacityRangeRule flags values above capacity", () => {
  const rule = new FallbackCsatDraftCapacityRangeRule(16, 64);
  const item = newFallbackCsatDraft("x", "y");
  item.capacity = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackCsatDraftCodeLengthRule flags a long code", () => {
  const rule = new FallbackCsatDraftCodeLengthRule(80);
  const item = newFallbackCsatDraft("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
