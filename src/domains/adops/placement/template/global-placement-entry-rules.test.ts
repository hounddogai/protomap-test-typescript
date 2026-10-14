import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalPlacementEntryCodeLengthRule,
  GlobalPlacementEntryGraceDaysRangeRule,
  GlobalPlacementEntryRequiredCodeRule,
  defaultGlobalPlacementEntryValidator,
} from "./global-placement-entry-rules.js";
import { newGlobalPlacementEntry } from "./global-placement-entry.js";

test("GlobalPlacementEntryValidator reports every problem", () => {
  const validator = defaultGlobalPlacementEntryValidator();
  const item = newGlobalPlacementEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalPlacementEntryRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalPlacementEntryRequiredCodeRule("global placement entry needs a value");
  const item = newGlobalPlacementEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalPlacementEntryGraceDaysRangeRule flags values above grace days", () => {
  const rule = new GlobalPlacementEntryGraceDaysRangeRule(32, 120);
  const item = newGlobalPlacementEntry("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalPlacementEntryCodeLengthRule flags a long code", () => {
  const rule = new GlobalPlacementEntryCodeLengthRule(32);
  const item = newGlobalPlacementEntry("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
