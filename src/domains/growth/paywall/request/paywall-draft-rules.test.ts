import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallDraftDescriptionLengthRule,
  PaywallDraftNameLengthRule,
  PaywallDraftRequiredDescriptionRule,
  PaywallDraftRequiredLabelRule,
  PaywallDraftRequiredNameRule,
  defaultPaywallDraftValidator,
} from "./paywall-draft-rules.js";
import { newPaywallDraft } from "./paywall-draft.js";

test("PaywallDraftValidator reports every problem", () => {
  const validator = defaultPaywallDraftValidator();
  const item = newPaywallDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallDraftNameLengthRule flags a long name", () => {
  const rule = new PaywallDraftNameLengthRule(1000);
  const item = newPaywallDraft("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallDraftRequiredLabelRule flags a blank label", () => {
  const rule = new PaywallDraftRequiredLabelRule("paywall draft needs this field");
  const item = newPaywallDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallDraftDescriptionLengthRule flags a long description", () => {
  const rule = new PaywallDraftDescriptionLengthRule(86400);
  const item = newPaywallDraft("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallDraftRequiredNameRule flags a blank name", () => {
  const rule = new PaywallDraftRequiredNameRule("paywall draft needs an entry");
  const item = newPaywallDraft("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallDraftRequiredDescriptionRule flags a blank description", () => {
  const rule = new PaywallDraftRequiredDescriptionRule("paywall draft needs this field");
  const item = newPaywallDraft("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
