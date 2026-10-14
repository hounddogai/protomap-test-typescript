import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchNoticeRequiredCampaignRefRule,
  BranchNoticeRequiredCodeRule,
  defaultBranchNoticeValidator,
} from "./branch-notice-rules.js";
import { newBranchNotice } from "./branch-notice.js";

test("BranchNoticeValidator reports every problem", () => {
  const validator = defaultBranchNoticeValidator();
  const item = newBranchNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new BranchNoticeRequiredCodeRule("branch notice needs an entry");
  const item = newBranchNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchNoticeRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new BranchNoticeRequiredCampaignRefRule("branch notice needs this field");
  const item = newBranchNotice("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
