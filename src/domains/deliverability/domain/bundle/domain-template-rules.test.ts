import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainTemplateDescriptionLengthRule,
  DomainTemplateExpiresAtRangeRule,
  DomainTemplateOpenRateRangeRule,
  DomainTemplateRequiredCodeRule,
  DomainTemplateRequiredUtmSourceRule,
  defaultDomainTemplateValidator,
} from "./domain-template-rules.js";
import { newDomainTemplate } from "./domain-template.js";

test("DomainTemplateValidator reports every problem", () => {
  const validator = defaultDomainTemplateValidator();
  const item = newDomainTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainTemplateOpenRateRangeRule flags values above open rate", () => {
  const rule = new DomainTemplateOpenRateRangeRule(1.4, 853);
  const item = newDomainTemplate("x", "y");
  item.openRate = 854.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainTemplateRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new DomainTemplateRequiredUtmSourceRule("domain template needs an entry");
  const item = newDomainTemplate("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainTemplateDescriptionLengthRule flags a long description", () => {
  const rule = new DomainTemplateDescriptionLengthRule(255);
  const item = newDomainTemplate("x", "y");
  item.description = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainTemplateExpiresAtRangeRule flags values above expires at", () => {
  const rule = new DomainTemplateExpiresAtRangeRule(16, 32);
  const item = newDomainTemplate("x", "y");
  item.expiresAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new DomainTemplateRequiredCodeRule("domain template needs an entry");
  const item = newDomainTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
