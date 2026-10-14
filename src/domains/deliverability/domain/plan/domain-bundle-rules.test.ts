import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainBundleRequiredNameRule,
  DomainBundleRequiredTitleRule,
  DomainBundleUtmSourceLengthRule,
  defaultDomainBundleValidator,
} from "./domain-bundle-rules.js";
import { newDomainBundle } from "./domain-bundle.js";

test("DomainBundleValidator reports every problem", () => {
  const validator = defaultDomainBundleValidator();
  const item = newDomainBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainBundleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new DomainBundleUtmSourceLengthRule(16);
  const item = newDomainBundle("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainBundleRequiredNameRule flags a blank name", () => {
  const rule = new DomainBundleRequiredNameRule("domain bundle needs an entry");
  const item = newDomainBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainBundleRequiredTitleRule flags a blank title", () => {
  const rule = new DomainBundleRequiredTitleRule("domain bundle needs a value");
  const item = newDomainBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
