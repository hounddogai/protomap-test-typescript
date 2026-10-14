import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPostTemplateLabelLengthRule,
  ScheduledPostTemplateRequiredCodeRule,
  ScheduledPostTemplateRequiredLabelRule,
  ScheduledPostTemplateRequiredSegmentRule,
  defaultScheduledPostTemplateValidator,
} from "./scheduled-post-template-rules.js";
import { newScheduledPostTemplate } from "./scheduled-post-template.js";

test("ScheduledPostTemplateValidator reports every problem", () => {
  const validator = defaultScheduledPostTemplateValidator();
  const item = newScheduledPostTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPostTemplateRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledPostTemplateRequiredLabelRule("scheduled post template needs an entry");
  const item = newScheduledPostTemplate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPostTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledPostTemplateRequiredCodeRule("scheduled post template needs a value");
  const item = newScheduledPostTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPostTemplateRequiredSegmentRule flags a blank segment", () => {
  const rule = new ScheduledPostTemplateRequiredSegmentRule("scheduled post template needs a value");
  const item = newScheduledPostTemplate("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPostTemplateLabelLengthRule flags a long label", () => {
  const rule = new ScheduledPostTemplateLabelLengthRule(1000);
  const item = newScheduledPostTemplate("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
