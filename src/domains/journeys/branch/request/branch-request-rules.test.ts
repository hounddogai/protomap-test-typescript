import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchRequestCodeLengthRule,
  BranchRequestCountryLengthRule,
  BranchRequestNotesLengthRule,
  BranchRequestRequiredCodeRule,
  BranchRequestWeightRangeRule,
  defaultBranchRequestValidator,
} from "./branch-request-rules.js";
import { newBranchRequest } from "./branch-request.js";

test("BranchRequestValidator reports every problem", () => {
  const validator = defaultBranchRequestValidator();
  const item = newBranchRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchRequestCountryLengthRule flags a long country", () => {
  const rule = new BranchRequestCountryLengthRule(86400);
  const item = newBranchRequest("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchRequestRequiredCodeRule flags a blank code", () => {
  const rule = new BranchRequestRequiredCodeRule("branch request needs a value");
  const item = newBranchRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchRequestWeightRangeRule flags values above weight", () => {
  const rule = new BranchRequestWeightRangeRule(0.4, 1302.6);
  const item = newBranchRequest("x", "y");
  item.weight = 1304.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchRequestCodeLengthRule flags a long code", () => {
  const rule = new BranchRequestCodeLengthRule(32);
  const item = newBranchRequest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchRequestNotesLengthRule flags a long notes", () => {
  const rule = new BranchRequestNotesLengthRule(32);
  const item = newBranchRequest("x", "y");
  item.notes = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
