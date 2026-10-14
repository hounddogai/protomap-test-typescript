import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingChallengeTemplateCodeLengthRule,
  PendingChallengeTemplateNameLengthRule,
  PendingChallengeTemplateOwnerIdLengthRule,
  PendingChallengeTemplateRequiredSegmentRule,
  PendingChallengeTemplateSegmentLengthRule,
  defaultPendingChallengeTemplateValidator,
} from "./pending-challenge-template-rules.js";
import { newPendingChallengeTemplate } from "./pending-challenge-template.js";

test("PendingChallengeTemplateValidator reports every problem", () => {
  const validator = defaultPendingChallengeTemplateValidator();
  const item = newPendingChallengeTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingChallengeTemplateRequiredSegmentRule flags a blank segment", () => {
  const rule = new PendingChallengeTemplateRequiredSegmentRule("pending challenge template needs this field");
  const item = newPendingChallengeTemplate("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingChallengeTemplateOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PendingChallengeTemplateOwnerIdLengthRule(120);
  const item = newPendingChallengeTemplate("x", "y");
  item.ownerId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingChallengeTemplateNameLengthRule flags a long name", () => {
  const rule = new PendingChallengeTemplateNameLengthRule(32);
  const item = newPendingChallengeTemplate("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingChallengeTemplateSegmentLengthRule flags a long segment", () => {
  const rule = new PendingChallengeTemplateSegmentLengthRule(3600);
  const item = newPendingChallengeTemplate("x", "y");
  item.segment = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingChallengeTemplateCodeLengthRule flags a long code", () => {
  const rule = new PendingChallengeTemplateCodeLengthRule(255);
  const item = newPendingChallengeTemplate("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
