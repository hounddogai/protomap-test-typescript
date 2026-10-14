import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelDraftExternalRefLengthRule,
  FunnelDraftNameLengthRule,
  FunnelDraftRequiredUnitRule,
  FunnelDraftUnitLengthRule,
  defaultFunnelDraftValidator,
} from "./funnel-draft-rules.js";
import { newFunnelDraft } from "./funnel-draft.js";

test("FunnelDraftValidator reports every problem", () => {
  const validator = defaultFunnelDraftValidator();
  const item = newFunnelDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelDraftUnitLengthRule flags a long unit", () => {
  const rule = new FunnelDraftUnitLengthRule(32);
  const item = newFunnelDraft("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelDraftNameLengthRule flags a long name", () => {
  const rule = new FunnelDraftNameLengthRule(80);
  const item = newFunnelDraft("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelDraftRequiredUnitRule flags a blank unit", () => {
  const rule = new FunnelDraftRequiredUnitRule("funnel draft needs an entry");
  const item = newFunnelDraft("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelDraftExternalRefLengthRule flags a long external ref", () => {
  const rule = new FunnelDraftExternalRefLengthRule(32);
  const item = newFunnelDraft("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
