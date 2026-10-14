import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPostMilestoneCodeLengthRule,
  DefaultPostMilestoneNameLengthRule,
  DefaultPostMilestoneRequiredAudienceIdRule,
  DefaultPostMilestoneRequiredNameRule,
  defaultDefaultPostMilestoneValidator,
} from "./default-post-milestone-rules.js";
import { newDefaultPostMilestone } from "./default-post-milestone.js";

test("DefaultPostMilestoneValidator reports every problem", () => {
  const validator = defaultDefaultPostMilestoneValidator();
  const item = newDefaultPostMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPostMilestoneNameLengthRule flags a long name", () => {
  const rule = new DefaultPostMilestoneNameLengthRule(16);
  const item = newDefaultPostMilestone("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPostMilestoneRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new DefaultPostMilestoneRequiredAudienceIdRule("default post milestone needs an entry");
  const item = newDefaultPostMilestone("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPostMilestoneRequiredNameRule flags a blank name", () => {
  const rule = new DefaultPostMilestoneRequiredNameRule("default post milestone needs a value");
  const item = newDefaultPostMilestone("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPostMilestoneCodeLengthRule flags a long code", () => {
  const rule = new DefaultPostMilestoneCodeLengthRule(120);
  const item = newDefaultPostMilestone("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
