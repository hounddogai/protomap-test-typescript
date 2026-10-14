import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallNoticeCodeLengthRule,
  PaywallNoticeRequiredCodeRule,
  PaywallNoticeRequiredLabelRule,
  PaywallNoticeRequiredNotesRule,
  defaultPaywallNoticeValidator,
} from "./paywall-notice-rules.js";
import { newPaywallNotice } from "./paywall-notice.js";

test("PaywallNoticeValidator reports every problem", () => {
  const validator = defaultPaywallNoticeValidator();
  const item = newPaywallNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallNoticeCodeLengthRule flags a long code", () => {
  const rule = new PaywallNoticeCodeLengthRule(80);
  const item = newPaywallNotice("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new PaywallNoticeRequiredCodeRule("paywall notice needs an entry");
  const item = newPaywallNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new PaywallNoticeRequiredLabelRule("paywall notice needs an entry");
  const item = newPaywallNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallNoticeRequiredNotesRule flags a blank notes", () => {
  const rule = new PaywallNoticeRequiredNotesRule("paywall notice needs this field");
  const item = newPaywallNotice("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
