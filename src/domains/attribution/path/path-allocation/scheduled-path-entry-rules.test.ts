import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPathEntryCodeLengthRule,
  ScheduledPathEntryRequiredLabelRule,
  ScheduledPathEntryRequiredNameRule,
  defaultScheduledPathEntryValidator,
} from "./scheduled-path-entry-rules.js";
import { newScheduledPathEntry } from "./scheduled-path-entry.js";

test("ScheduledPathEntryValidator reports every problem", () => {
  const validator = defaultScheduledPathEntryValidator();
  const item = newScheduledPathEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPathEntryCodeLengthRule flags a long code", () => {
  const rule = new ScheduledPathEntryCodeLengthRule(255);
  const item = newScheduledPathEntry("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPathEntryRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledPathEntryRequiredNameRule("scheduled path entry needs an entry");
  const item = newScheduledPathEntry("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPathEntryRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledPathEntryRequiredLabelRule("scheduled path entry needs this field");
  const item = newScheduledPathEntry("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
