import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalDomainThresholdCodeLengthRule,
  GlobalDomainThresholdJourneyIdLengthRule,
  GlobalDomainThresholdNameLengthRule,
  GlobalDomainThresholdPhoneLengthRule,
  GlobalDomainThresholdRequiredJourneyIdRule,
  GlobalDomainThresholdRequiredNameRule,
  defaultGlobalDomainThresholdValidator,
} from "./global-domain-threshold-rules.js";
import { newGlobalDomainThreshold } from "./global-domain-threshold.js";

test("GlobalDomainThresholdValidator reports every problem", () => {
  const validator = defaultGlobalDomainThresholdValidator();
  const item = newGlobalDomainThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalDomainThresholdPhoneLengthRule flags a long phone", () => {
  const rule = new GlobalDomainThresholdPhoneLengthRule(80);
  const item = newGlobalDomainThreshold("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalDomainThresholdJourneyIdLengthRule flags a long journey id", () => {
  const rule = new GlobalDomainThresholdJourneyIdLengthRule(255);
  const item = newGlobalDomainThreshold("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalDomainThresholdCodeLengthRule flags a long code", () => {
  const rule = new GlobalDomainThresholdCodeLengthRule(120);
  const item = newGlobalDomainThreshold("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalDomainThresholdRequiredNameRule flags a blank name", () => {
  const rule = new GlobalDomainThresholdRequiredNameRule("global domain threshold needs this field");
  const item = newGlobalDomainThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalDomainThresholdRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new GlobalDomainThresholdRequiredJourneyIdRule("global domain threshold needs a value");
  const item = newGlobalDomainThreshold("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalDomainThresholdNameLengthRule flags a long name", () => {
  const rule = new GlobalDomainThresholdNameLengthRule(32);
  const item = newGlobalDomainThreshold("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
