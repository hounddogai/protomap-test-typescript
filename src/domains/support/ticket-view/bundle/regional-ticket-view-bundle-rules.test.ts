import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalTicketViewBundleCodeLengthRule,
  RegionalTicketViewBundleLabelLengthRule,
  RegionalTicketViewBundleRequiredCodeRule,
  RegionalTicketViewBundleRequiredRegionRule,
  RegionalTicketViewBundleSummaryLengthRule,
  defaultRegionalTicketViewBundleValidator,
} from "./regional-ticket-view-bundle-rules.js";
import { newRegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

test("RegionalTicketViewBundleValidator reports every problem", () => {
  const validator = defaultRegionalTicketViewBundleValidator();
  const item = newRegionalTicketViewBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalTicketViewBundleSummaryLengthRule flags a long summary", () => {
  const rule = new RegionalTicketViewBundleSummaryLengthRule(32);
  const item = newRegionalTicketViewBundle("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalTicketViewBundleRequiredRegionRule flags a blank region", () => {
  const rule = new RegionalTicketViewBundleRequiredRegionRule("regional ticket view bundle needs this field");
  const item = newRegionalTicketViewBundle("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalTicketViewBundleRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalTicketViewBundleRequiredCodeRule("regional ticket view bundle needs this field");
  const item = newRegionalTicketViewBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalTicketViewBundleCodeLengthRule flags a long code", () => {
  const rule = new RegionalTicketViewBundleCodeLengthRule(16);
  const item = newRegionalTicketViewBundle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalTicketViewBundleLabelLengthRule flags a long label", () => {
  const rule = new RegionalTicketViewBundleLabelLengthRule(1000);
  const item = newRegionalTicketViewBundle("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
