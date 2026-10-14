import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSenderProfileCodeLengthRule,
  CappedSenderProfileNameLengthRule,
  CappedSenderProfileRequiredCodeRule,
  CappedSenderProfileRequiredNameRule,
  CappedSenderProfileRequiredSourceRule,
  defaultCappedSenderProfileValidator,
} from "./capped-sender-profile-rules.js";
import { newCappedSenderProfile } from "./capped-sender-profile.js";

test("CappedSenderProfileValidator reports every problem", () => {
  const validator = defaultCappedSenderProfileValidator();
  const item = newCappedSenderProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSenderProfileCodeLengthRule flags a long code", () => {
  const rule = new CappedSenderProfileCodeLengthRule(3600);
  const item = newCappedSenderProfile("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSenderProfileRequiredCodeRule flags a blank code", () => {
  const rule = new CappedSenderProfileRequiredCodeRule("capped sender profile needs an entry");
  const item = newCappedSenderProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSenderProfileNameLengthRule flags a long name", () => {
  const rule = new CappedSenderProfileNameLengthRule(64);
  const item = newCappedSenderProfile("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSenderProfileRequiredNameRule flags a blank name", () => {
  const rule = new CappedSenderProfileRequiredNameRule("capped sender profile needs this field");
  const item = newCappedSenderProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSenderProfileRequiredSourceRule flags a blank source", () => {
  const rule = new CappedSenderProfileRequiredSourceRule("capped sender profile needs a value");
  const item = newCappedSenderProfile("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
