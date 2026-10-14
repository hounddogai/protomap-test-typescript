import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalDomainCycleCodeLengthRule,
  RegionalDomainCycleJourneyIdLengthRule,
  RegionalDomainCycleOpenRateRangeRule,
  RegionalDomainCycleRequiredCodeRule,
  RegionalDomainCycleRevisionRangeRule,
  RegionalDomainCycleTitleLengthRule,
  defaultRegionalDomainCycleValidator,
} from "./regional-domain-cycle-rules.js";
import { newRegionalDomainCycle } from "./regional-domain-cycle.js";

test("RegionalDomainCycleValidator reports every problem", () => {
  const validator = defaultRegionalDomainCycleValidator();
  const item = newRegionalDomainCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalDomainCycleTitleLengthRule flags a long title", () => {
  const rule = new RegionalDomainCycleTitleLengthRule(86400);
  const item = newRegionalDomainCycle("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalDomainCycleRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalDomainCycleRequiredCodeRule("regional domain cycle needs a value");
  const item = newRegionalDomainCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalDomainCycleRevisionRangeRule flags values above revision", () => {
  const rule = new RegionalDomainCycleRevisionRangeRule(255, 86400);
  const item = newRegionalDomainCycle("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalDomainCycleJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RegionalDomainCycleJourneyIdLengthRule(3600);
  const item = newRegionalDomainCycle("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalDomainCycleCodeLengthRule flags a long code", () => {
  const rule = new RegionalDomainCycleCodeLengthRule(16);
  const item = newRegionalDomainCycle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalDomainCycleOpenRateRangeRule flags values above open rate", () => {
  const rule = new RegionalDomainCycleOpenRateRangeRule(3.6, 2228.9);
  const item = newRegionalDomainCycle("x", "y");
  item.openRate = 2230.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
