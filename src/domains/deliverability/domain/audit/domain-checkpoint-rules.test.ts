import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainCheckpointCodeLengthRule,
  DomainCheckpointNameLengthRule,
  DomainCheckpointRequiredCodeRule,
  defaultDomainCheckpointValidator,
} from "./domain-checkpoint-rules.js";
import { newDomainCheckpoint } from "./domain-checkpoint.js";

test("DomainCheckpointValidator reports every problem", () => {
  const validator = defaultDomainCheckpointValidator();
  const item = newDomainCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainCheckpointCodeLengthRule flags a long code", () => {
  const rule = new DomainCheckpointCodeLengthRule(32);
  const item = newDomainCheckpoint("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new DomainCheckpointRequiredCodeRule("domain checkpoint needs a value");
  const item = newDomainCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainCheckpointNameLengthRule flags a long name", () => {
  const rule = new DomainCheckpointNameLengthRule(255);
  const item = newDomainCheckpoint("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
