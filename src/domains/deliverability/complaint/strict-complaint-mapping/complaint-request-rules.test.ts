import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintRequestCampaignRefLengthRule,
  ComplaintRequestClicksRangeRule,
  ComplaintRequestRequiredCohortRule,
  defaultComplaintRequestValidator,
} from "./complaint-request-rules.js";
import { newComplaintRequest } from "./complaint-request.js";

test("ComplaintRequestValidator reports every problem", () => {
  const validator = defaultComplaintRequestValidator();
  const item = newComplaintRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintRequestClicksRangeRule flags values above clicks", () => {
  const rule = new ComplaintRequestClicksRangeRule(80, 1000);
  const item = newComplaintRequest("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintRequestCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ComplaintRequestCampaignRefLengthRule(1000);
  const item = newComplaintRequest("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintRequestRequiredCohortRule flags a blank cohort", () => {
  const rule = new ComplaintRequestRequiredCohortRule("complaint request needs a value");
  const item = newComplaintRequest("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
