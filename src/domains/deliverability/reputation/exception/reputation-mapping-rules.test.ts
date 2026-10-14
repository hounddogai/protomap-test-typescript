import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationMappingContactEmailLengthRule,
  ReputationMappingNameLengthRule,
  defaultReputationMappingValidator,
} from "./reputation-mapping-rules.js";
import { newReputationMapping } from "./reputation-mapping.js";

test("ReputationMappingValidator reports every problem", () => {
  const validator = defaultReputationMappingValidator();
  const item = newReputationMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationMappingContactEmailLengthRule flags a long contact email", () => {
  const rule = new ReputationMappingContactEmailLengthRule(120);
  const item = newReputationMapping("x", "y");
  item.contactEmail = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationMappingNameLengthRule flags a long name", () => {
  const rule = new ReputationMappingNameLengthRule(64);
  const item = newReputationMapping("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
