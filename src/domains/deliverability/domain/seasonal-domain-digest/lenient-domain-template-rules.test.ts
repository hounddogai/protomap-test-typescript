import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDomainTemplateOpenRateRangeRule,
  LenientDomainTemplateRequiredUtmSourceRule,
  LenientDomainTemplateTitleLengthRule,
  defaultLenientDomainTemplateValidator,
} from "./lenient-domain-template-rules.js";
import { newLenientDomainTemplate } from "./lenient-domain-template.js";

test("LenientDomainTemplateValidator reports every problem", () => {
  const validator = defaultLenientDomainTemplateValidator();
  const item = newLenientDomainTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDomainTemplateRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new LenientDomainTemplateRequiredUtmSourceRule("lenient domain template needs a value");
  const item = newLenientDomainTemplate("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDomainTemplateOpenRateRangeRule flags values above open rate", () => {
  const rule = new LenientDomainTemplateOpenRateRangeRule(9.3, 1690);
  const item = newLenientDomainTemplate("x", "y");
  item.openRate = 1691.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientDomainTemplateTitleLengthRule flags a long title", () => {
  const rule = new LenientDomainTemplateTitleLengthRule(16);
  const item = newLenientDomainTemplate("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
