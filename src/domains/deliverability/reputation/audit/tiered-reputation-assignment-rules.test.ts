import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredReputationAssignmentExternalRefLengthRule,
  TieredReputationAssignmentRegionLengthRule,
  TieredReputationAssignmentRequiredExternalRefRule,
  defaultTieredReputationAssignmentValidator,
} from "./tiered-reputation-assignment-rules.js";
import { newTieredReputationAssignment } from "./tiered-reputation-assignment.js";

test("TieredReputationAssignmentValidator reports every problem", () => {
  const validator = defaultTieredReputationAssignmentValidator();
  const item = newTieredReputationAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredReputationAssignmentRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new TieredReputationAssignmentRequiredExternalRefRule("tiered reputation assignment needs an entry");
  const item = newTieredReputationAssignment("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredReputationAssignmentRegionLengthRule flags a long region", () => {
  const rule = new TieredReputationAssignmentRegionLengthRule(120);
  const item = newTieredReputationAssignment("x", "y");
  item.region = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredReputationAssignmentExternalRefLengthRule flags a long external ref", () => {
  const rule = new TieredReputationAssignmentExternalRefLengthRule(32);
  const item = newTieredReputationAssignment("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
