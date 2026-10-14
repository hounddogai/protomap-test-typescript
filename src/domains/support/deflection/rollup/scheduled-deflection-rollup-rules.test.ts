import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDeflectionRollupCodeLengthRule,
  ScheduledDeflectionRollupOwnerIdLengthRule,
  ScheduledDeflectionRollupRequiredNameRule,
  ScheduledDeflectionRollupRequiredOwnerIdRule,
  ScheduledDeflectionRollupVersionRangeRule,
  defaultScheduledDeflectionRollupValidator,
} from "./scheduled-deflection-rollup-rules.js";
import { newScheduledDeflectionRollup } from "./scheduled-deflection-rollup.js";

test("ScheduledDeflectionRollupValidator reports every problem", () => {
  const validator = defaultScheduledDeflectionRollupValidator();
  const item = newScheduledDeflectionRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDeflectionRollupOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ScheduledDeflectionRollupOwnerIdLengthRule(16);
  const item = newScheduledDeflectionRollup("x", "y");
  item.ownerId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDeflectionRollupRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ScheduledDeflectionRollupRequiredOwnerIdRule("scheduled deflection rollup needs this field");
  const item = newScheduledDeflectionRollup("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledDeflectionRollupVersionRangeRule flags values above version", () => {
  const rule = new ScheduledDeflectionRollupVersionRangeRule(32, 32);
  const item = newScheduledDeflectionRollup("x", "y");
  item.version = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDeflectionRollupCodeLengthRule flags a long code", () => {
  const rule = new ScheduledDeflectionRollupCodeLengthRule(32);
  const item = newScheduledDeflectionRollup("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDeflectionRollupRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledDeflectionRollupRequiredNameRule("scheduled deflection rollup needs this field");
  const item = newScheduledDeflectionRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
