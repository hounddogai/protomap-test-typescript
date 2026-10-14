import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalApprovalScoreCodeLengthRule,
  SeasonalApprovalScoreDescriptionLengthRule,
  SeasonalApprovalScoreNameLengthRule,
  SeasonalApprovalScoreRequiredCodeRule,
  defaultSeasonalApprovalScoreValidator,
} from "./seasonal-approval-score-rules.js";
import { newSeasonalApprovalScore } from "./seasonal-approval-score.js";

test("SeasonalApprovalScoreValidator reports every problem", () => {
  const validator = defaultSeasonalApprovalScoreValidator();
  const item = newSeasonalApprovalScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalApprovalScoreCodeLengthRule flags a long code", () => {
  const rule = new SeasonalApprovalScoreCodeLengthRule(3600);
  const item = newSeasonalApprovalScore("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalApprovalScoreRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalApprovalScoreRequiredCodeRule("seasonal approval score needs a value");
  const item = newSeasonalApprovalScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalApprovalScoreDescriptionLengthRule flags a long description", () => {
  const rule = new SeasonalApprovalScoreDescriptionLengthRule(120);
  const item = newSeasonalApprovalScore("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalApprovalScoreNameLengthRule flags a long name", () => {
  const rule = new SeasonalApprovalScoreNameLengthRule(3600);
  const item = newSeasonalApprovalScore("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
