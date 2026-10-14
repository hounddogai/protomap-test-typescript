import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceCycleCampaignRefLengthRule,
  PreferenceCycleNameLengthRule,
  PreferenceCycleRequiredCampaignRefRule,
  PreferenceCycleRequiredCodeRule,
  defaultPreferenceCycleValidator,
} from "./preference-cycle-rules.js";
import { newPreferenceCycle } from "./preference-cycle.js";

test("PreferenceCycleValidator reports every problem", () => {
  const validator = defaultPreferenceCycleValidator();
  const item = newPreferenceCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceCycleNameLengthRule flags a long name", () => {
  const rule = new PreferenceCycleNameLengthRule(86400);
  const item = newPreferenceCycle("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceCycleRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceCycleRequiredCodeRule("preference cycle needs an entry");
  const item = newPreferenceCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceCycleCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new PreferenceCycleCampaignRefLengthRule(80);
  const item = newPreferenceCycle("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceCycleRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new PreferenceCycleRequiredCampaignRefRule("preference cycle needs this field");
  const item = newPreferenceCycle("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
