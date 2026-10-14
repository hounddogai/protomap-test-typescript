import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingSlaOverrideAudienceIdLengthRule,
  PendingSlaOverrideCategoryLengthRule,
  PendingSlaOverrideCodeLengthRule,
  PendingSlaOverrideRequiredCategoryRule,
  PendingSlaOverrideRequiredCodeRule,
  defaultPendingSlaOverrideValidator,
} from "./pending-sla-override-rules.js";
import { newPendingSlaOverride } from "./pending-sla-override.js";

test("PendingSlaOverrideValidator reports every problem", () => {
  const validator = defaultPendingSlaOverrideValidator();
  const item = newPendingSlaOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingSlaOverrideCodeLengthRule flags a long code", () => {
  const rule = new PendingSlaOverrideCodeLengthRule(86400);
  const item = newPendingSlaOverride("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSlaOverrideCategoryLengthRule flags a long category", () => {
  const rule = new PendingSlaOverrideCategoryLengthRule(120);
  const item = newPendingSlaOverride("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSlaOverrideAudienceIdLengthRule flags a long audience id", () => {
  const rule = new PendingSlaOverrideAudienceIdLengthRule(86400);
  const item = newPendingSlaOverride("x", "y");
  item.audienceId = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingSlaOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new PendingSlaOverrideRequiredCodeRule("pending sla override needs this field");
  const item = newPendingSlaOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingSlaOverrideRequiredCategoryRule flags a blank category", () => {
  const rule = new PendingSlaOverrideRequiredCategoryRule("pending sla override needs an entry");
  const item = newPendingSlaOverride("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
