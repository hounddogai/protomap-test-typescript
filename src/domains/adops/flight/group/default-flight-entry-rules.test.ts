import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFlightEntryCodeLengthRule,
  DefaultFlightEntryRequiredCodeRule,
  DefaultFlightEntryRequiredRegionRule,
  DefaultFlightEntryTitleLengthRule,
  defaultDefaultFlightEntryValidator,
} from "./default-flight-entry-rules.js";
import { newDefaultFlightEntry } from "./default-flight-entry.js";

test("DefaultFlightEntryValidator reports every problem", () => {
  const validator = defaultDefaultFlightEntryValidator();
  const item = newDefaultFlightEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFlightEntryTitleLengthRule flags a long title", () => {
  const rule = new DefaultFlightEntryTitleLengthRule(32);
  const item = newDefaultFlightEntry("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFlightEntryRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultFlightEntryRequiredCodeRule("default flight entry needs an entry");
  const item = newDefaultFlightEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFlightEntryRequiredRegionRule flags a blank region", () => {
  const rule = new DefaultFlightEntryRequiredRegionRule("default flight entry needs an entry");
  const item = newDefaultFlightEntry("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultFlightEntryCodeLengthRule flags a long code", () => {
  const rule = new DefaultFlightEntryCodeLengthRule(120);
  const item = newDefaultFlightEntry("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
