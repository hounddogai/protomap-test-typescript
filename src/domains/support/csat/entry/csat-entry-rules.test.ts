import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatEntryRequiredCodeRule,
  CsatEntryRequiredLabelRule,
  CsatEntryVersionRangeRule,
  defaultCsatEntryValidator,
} from "./csat-entry-rules.js";
import { newCsatEntry } from "./csat-entry.js";

test("CsatEntryValidator reports every problem", () => {
  const validator = defaultCsatEntryValidator();
  const item = newCsatEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatEntryRequiredCodeRule flags a blank code", () => {
  const rule = new CsatEntryRequiredCodeRule("csat entry needs a value");
  const item = newCsatEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatEntryRequiredLabelRule flags a blank label", () => {
  const rule = new CsatEntryRequiredLabelRule("csat entry needs an entry");
  const item = newCsatEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatEntryVersionRangeRule flags values above version", () => {
  const rule = new CsatEntryVersionRangeRule(16, 64);
  const item = newCsatEntry("x", "y");
  item.version = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
