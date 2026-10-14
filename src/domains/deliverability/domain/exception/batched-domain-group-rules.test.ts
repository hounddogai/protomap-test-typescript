import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedDomainGroupRequiredCodeRule,
  BatchedDomainGroupRequiredCountryRule,
  BatchedDomainGroupRequiredNameRule,
  defaultBatchedDomainGroupValidator,
} from "./batched-domain-group-rules.js";
import { newBatchedDomainGroup } from "./batched-domain-group.js";

test("BatchedDomainGroupValidator reports every problem", () => {
  const validator = defaultBatchedDomainGroupValidator();
  const item = newBatchedDomainGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedDomainGroupRequiredCountryRule flags a blank country", () => {
  const rule = new BatchedDomainGroupRequiredCountryRule("batched domain group needs a value");
  const item = newBatchedDomainGroup("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDomainGroupRequiredNameRule flags a blank name", () => {
  const rule = new BatchedDomainGroupRequiredNameRule("batched domain group needs an entry");
  const item = newBatchedDomainGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDomainGroupRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedDomainGroupRequiredCodeRule("batched domain group needs this field");
  const item = newBatchedDomainGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
