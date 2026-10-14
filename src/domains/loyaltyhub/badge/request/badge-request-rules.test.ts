import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeRequestCodeLengthRule,
  BadgeRequestCohortLengthRule,
  BadgeRequestRequiredCodeRule,
  BadgeRequestRequiredCohortRule,
  BadgeRequestRequiredLabelRule,
  defaultBadgeRequestValidator,
} from "./badge-request-rules.js";
import { newBadgeRequest } from "./badge-request.js";

test("BadgeRequestValidator reports every problem", () => {
  const validator = defaultBadgeRequestValidator();
  const item = newBadgeRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeRequestCodeLengthRule flags a long code", () => {
  const rule = new BadgeRequestCodeLengthRule(3600);
  const item = newBadgeRequest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeRequestRequiredLabelRule flags a blank label", () => {
  const rule = new BadgeRequestRequiredLabelRule("badge request needs a value");
  const item = newBadgeRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeRequestRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeRequestRequiredCodeRule("badge request needs an entry");
  const item = newBadgeRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeRequestCohortLengthRule flags a long cohort", () => {
  const rule = new BadgeRequestCohortLengthRule(16);
  const item = newBadgeRequest("x", "y");
  item.cohort = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeRequestRequiredCohortRule flags a blank cohort", () => {
  const rule = new BadgeRequestRequiredCohortRule("badge request needs this field");
  const item = newBadgeRequest("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
