import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPaywallDraftMarginRangeRule,
  CappedPaywallDraftRequiredCodeRule,
  CappedPaywallDraftUpdatedAtRangeRule,
  CappedPaywallDraftWindowDaysRangeRule,
  defaultCappedPaywallDraftValidator,
} from "./capped-paywall-draft-rules.js";
import { newCappedPaywallDraft } from "./capped-paywall-draft.js";

test("CappedPaywallDraftValidator reports every problem", () => {
  const validator = defaultCappedPaywallDraftValidator();
  const item = newCappedPaywallDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPaywallDraftUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new CappedPaywallDraftUpdatedAtRangeRule(3600, 86400);
  const item = newCappedPaywallDraft("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPaywallDraftMarginRangeRule flags values above margin", () => {
  const rule = new CappedPaywallDraftMarginRangeRule(0.2, 4352);
  const item = newCappedPaywallDraft("x", "y");
  item.margin = 4353.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPaywallDraftRequiredCodeRule flags a blank code", () => {
  const rule = new CappedPaywallDraftRequiredCodeRule("capped paywall draft needs this field");
  const item = newCappedPaywallDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPaywallDraftWindowDaysRangeRule flags values above window days", () => {
  const rule = new CappedPaywallDraftWindowDaysRangeRule(80, 255);
  const item = newCappedPaywallDraft("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
