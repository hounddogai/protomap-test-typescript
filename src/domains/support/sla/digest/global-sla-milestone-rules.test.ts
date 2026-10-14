import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSlaMilestoneCodeLengthRule,
  GlobalSlaMilestoneContactEmailLengthRule,
  GlobalSlaMilestoneRequiredContactEmailRule,
  GlobalSlaMilestoneRequiredLabelRule,
  defaultGlobalSlaMilestoneValidator,
} from "./global-sla-milestone-rules.js";
import { newGlobalSlaMilestone } from "./global-sla-milestone.js";

test("GlobalSlaMilestoneValidator reports every problem", () => {
  const validator = defaultGlobalSlaMilestoneValidator();
  const item = newGlobalSlaMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSlaMilestoneCodeLengthRule flags a long code", () => {
  const rule = new GlobalSlaMilestoneCodeLengthRule(1000);
  const item = newGlobalSlaMilestone("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSlaMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalSlaMilestoneRequiredLabelRule("global sla milestone needs a value");
  const item = newGlobalSlaMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalSlaMilestoneContactEmailLengthRule flags a long contact email", () => {
  const rule = new GlobalSlaMilestoneContactEmailLengthRule(86400);
  const item = newGlobalSlaMilestone("x", "y");
  item.contactEmail = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSlaMilestoneRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new GlobalSlaMilestoneRequiredContactEmailRule("global sla milestone needs this field");
  const item = newGlobalSlaMilestone("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
