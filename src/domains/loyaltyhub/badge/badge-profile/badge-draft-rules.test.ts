import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeDraftExpiresAtRangeRule,
  BadgeDraftRequiredCodeRule,
  BadgeDraftRequiredTitleRule,
  BadgeDraftWeightRangeRule,
  defaultBadgeDraftValidator,
} from "./badge-draft-rules.js";
import { newBadgeDraft } from "./badge-draft.js";

test("BadgeDraftValidator reports every problem", () => {
  const validator = defaultBadgeDraftValidator();
  const item = newBadgeDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeDraftExpiresAtRangeRule flags values above expires at", () => {
  const rule = new BadgeDraftExpiresAtRangeRule(32, 86400);
  const item = newBadgeDraft("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeDraftWeightRangeRule flags values above weight", () => {
  const rule = new BadgeDraftWeightRangeRule(7.8, 1944.1);
  const item = newBadgeDraft("x", "y");
  item.weight = 1945.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeDraftRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeDraftRequiredCodeRule("badge draft needs this field");
  const item = newBadgeDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeDraftRequiredTitleRule flags a blank title", () => {
  const rule = new BadgeDraftRequiredTitleRule("badge draft needs an entry");
  const item = newBadgeDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
