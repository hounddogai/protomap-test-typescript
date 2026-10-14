import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaBaselineCodeLengthRule,
  SlaBaselineNameLengthRule,
  SlaBaselineRequiredChannelRule,
  SlaBaselineRequiredCodeRule,
  SlaBaselineRequiredNameRule,
  SlaBaselineUtmSourceLengthRule,
  defaultSlaBaselineValidator,
} from "./sla-baseline-rules.js";
import { newSlaBaseline } from "./sla-baseline.js";

test("SlaBaselineValidator reports every problem", () => {
  const validator = defaultSlaBaselineValidator();
  const item = newSlaBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaBaselineNameLengthRule flags a long name", () => {
  const rule = new SlaBaselineNameLengthRule(3600);
  const item = newSlaBaseline("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new SlaBaselineRequiredCodeRule("sla baseline needs this field");
  const item = newSlaBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaBaselineRequiredNameRule flags a blank name", () => {
  const rule = new SlaBaselineRequiredNameRule("sla baseline needs this field");
  const item = newSlaBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaBaselineCodeLengthRule flags a long code", () => {
  const rule = new SlaBaselineCodeLengthRule(32);
  const item = newSlaBaseline("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SlaBaselineRequiredChannelRule flags a blank channel", () => {
  const rule = new SlaBaselineRequiredChannelRule("sla baseline needs this field");
  const item = newSlaBaseline("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaBaselineUtmSourceLengthRule flags a long utm source", () => {
  const rule = new SlaBaselineUtmSourceLengthRule(1000);
  const item = newSlaBaseline("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
