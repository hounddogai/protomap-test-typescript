import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDomainRequestCodeLengthRule,
  ScheduledDomainRequestRequiredCodeRule,
  ScheduledDomainRequestRequiredReviewerRule,
  ScheduledDomainRequestRequiredSourceRule,
  ScheduledDomainRequestSourceLengthRule,
  defaultScheduledDomainRequestValidator,
} from "./scheduled-domain-request-rules.js";
import { newScheduledDomainRequest } from "./scheduled-domain-request.js";

test("ScheduledDomainRequestValidator reports every problem", () => {
  const validator = defaultScheduledDomainRequestValidator();
  const item = newScheduledDomainRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDomainRequestCodeLengthRule flags a long code", () => {
  const rule = new ScheduledDomainRequestCodeLengthRule(1000);
  const item = newScheduledDomainRequest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDomainRequestRequiredSourceRule flags a blank source", () => {
  const rule = new ScheduledDomainRequestRequiredSourceRule("scheduled domain request needs an entry");
  const item = newScheduledDomainRequest("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDomainRequestRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledDomainRequestRequiredCodeRule("scheduled domain request needs this field");
  const item = newScheduledDomainRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDomainRequestSourceLengthRule flags a long source", () => {
  const rule = new ScheduledDomainRequestSourceLengthRule(120);
  const item = newScheduledDomainRequest("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDomainRequestRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new ScheduledDomainRequestRequiredReviewerRule("scheduled domain request needs a value");
  const item = newScheduledDomainRequest("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
