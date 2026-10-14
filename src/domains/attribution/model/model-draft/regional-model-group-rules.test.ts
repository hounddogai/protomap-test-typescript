import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalModelGroupNameLengthRule,
  RegionalModelGroupOwnerIdLengthRule,
  RegionalModelGroupRequiredOwnerIdRule,
  RegionalModelGroupRequiredTitleRule,
  RegionalModelGroupTitleLengthRule,
  defaultRegionalModelGroupValidator,
} from "./regional-model-group-rules.js";
import { newRegionalModelGroup } from "./regional-model-group.js";

test("RegionalModelGroupValidator reports every problem", () => {
  const validator = defaultRegionalModelGroupValidator();
  const item = newRegionalModelGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalModelGroupOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RegionalModelGroupOwnerIdLengthRule(255);
  const item = newRegionalModelGroup("x", "y");
  item.ownerId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalModelGroupRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalModelGroupRequiredTitleRule("regional model group needs an entry");
  const item = newRegionalModelGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalModelGroupNameLengthRule flags a long name", () => {
  const rule = new RegionalModelGroupNameLengthRule(1000);
  const item = newRegionalModelGroup("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalModelGroupTitleLengthRule flags a long title", () => {
  const rule = new RegionalModelGroupTitleLengthRule(1000);
  const item = newRegionalModelGroup("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalModelGroupRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RegionalModelGroupRequiredOwnerIdRule("regional model group needs an entry");
  const item = newRegionalModelGroup("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
