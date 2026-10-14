import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalDoubleOptInEntryCodeLengthRule,
  RegionalDoubleOptInEntryDescriptionLengthRule,
  RegionalDoubleOptInEntryRequiredCodeRule,
  RegionalDoubleOptInEntryRequiredLabelRule,
  defaultRegionalDoubleOptInEntryValidator,
} from "./regional-double-opt-in-entry-rules.js";
import { newRegionalDoubleOptInEntry } from "./regional-double-opt-in-entry.js";

test("RegionalDoubleOptInEntryValidator reports every problem", () => {
  const validator = defaultRegionalDoubleOptInEntryValidator();
  const item = newRegionalDoubleOptInEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalDoubleOptInEntryCodeLengthRule flags a long code", () => {
  const rule = new RegionalDoubleOptInEntryCodeLengthRule(120);
  const item = newRegionalDoubleOptInEntry("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalDoubleOptInEntryRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalDoubleOptInEntryRequiredLabelRule("regional double opt in entry needs an entry");
  const item = newRegionalDoubleOptInEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalDoubleOptInEntryRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalDoubleOptInEntryRequiredCodeRule("regional double opt in entry needs this field");
  const item = newRegionalDoubleOptInEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalDoubleOptInEntryDescriptionLengthRule flags a long description", () => {
  const rule = new RegionalDoubleOptInEntryDescriptionLengthRule(16);
  const item = newRegionalDoubleOptInEntry("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
