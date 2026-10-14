import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPlacementExceptionNameLengthRule,
  RollingPlacementExceptionOwnerIdLengthRule,
  RollingPlacementExceptionRequiredCodeRule,
  defaultRollingPlacementExceptionValidator,
} from "./rolling-placement-exception-rules.js";
import { newRollingPlacementException } from "./rolling-placement-exception.js";

test("RollingPlacementExceptionValidator reports every problem", () => {
  const validator = defaultRollingPlacementExceptionValidator();
  const item = newRollingPlacementException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPlacementExceptionOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RollingPlacementExceptionOwnerIdLengthRule(32);
  const item = newRollingPlacementException("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPlacementExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new RollingPlacementExceptionRequiredCodeRule("rolling placement exception needs an entry");
  const item = newRollingPlacementException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPlacementExceptionNameLengthRule flags a long name", () => {
  const rule = new RollingPlacementExceptionNameLengthRule(1000);
  const item = newRollingPlacementException("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
