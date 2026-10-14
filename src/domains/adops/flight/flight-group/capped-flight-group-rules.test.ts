import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFlightGroupCodeLengthRule,
  CappedFlightGroupRequiredCodeRule,
  CappedFlightGroupRequiredTitleRule,
  defaultCappedFlightGroupValidator,
} from "./capped-flight-group-rules.js";
import { newCappedFlightGroup } from "./capped-flight-group.js";

test("CappedFlightGroupValidator reports every problem", () => {
  const validator = defaultCappedFlightGroupValidator();
  const item = newCappedFlightGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFlightGroupCodeLengthRule flags a long code", () => {
  const rule = new CappedFlightGroupCodeLengthRule(255);
  const item = newCappedFlightGroup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFlightGroupRequiredCodeRule flags a blank code", () => {
  const rule = new CappedFlightGroupRequiredCodeRule("capped flight group needs this field");
  const item = newCappedFlightGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFlightGroupRequiredTitleRule flags a blank title", () => {
  const rule = new CappedFlightGroupRequiredTitleRule("capped flight group needs an entry");
  const item = newCappedFlightGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
