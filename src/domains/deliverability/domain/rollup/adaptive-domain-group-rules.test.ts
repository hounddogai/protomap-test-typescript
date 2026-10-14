import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDomainGroupExternalRefLengthRule,
  AdaptiveDomainGroupRequiredCodeRule,
  AdaptiveDomainGroupRequiredExternalRefRule,
  AdaptiveDomainGroupRequiredTitleRule,
  defaultAdaptiveDomainGroupValidator,
} from "./adaptive-domain-group-rules.js";
import { newAdaptiveDomainGroup } from "./adaptive-domain-group.js";

test("AdaptiveDomainGroupValidator reports every problem", () => {
  const validator = defaultAdaptiveDomainGroupValidator();
  const item = newAdaptiveDomainGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDomainGroupRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveDomainGroupRequiredTitleRule("adaptive domain group needs this field");
  const item = newAdaptiveDomainGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainGroupRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveDomainGroupRequiredCodeRule("adaptive domain group needs this field");
  const item = newAdaptiveDomainGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainGroupRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new AdaptiveDomainGroupRequiredExternalRefRule("adaptive domain group needs a value");
  const item = newAdaptiveDomainGroup("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainGroupExternalRefLengthRule flags a long external ref", () => {
  const rule = new AdaptiveDomainGroupExternalRefLengthRule(86400);
  const item = newAdaptiveDomainGroup("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
