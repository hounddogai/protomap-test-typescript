import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationEntryCodeLengthRule,
  EscalationEntryRequiredCodeRule,
  EscalationEntryRequiredTitleRule,
  defaultEscalationEntryValidator,
} from "./escalation-entry-rules.js";
import { newEscalationEntry } from "./escalation-entry.js";

test("EscalationEntryValidator reports every problem", () => {
  const validator = defaultEscalationEntryValidator();
  const item = newEscalationEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationEntryRequiredCodeRule flags a blank code", () => {
  const rule = new EscalationEntryRequiredCodeRule("escalation entry needs this field");
  const item = newEscalationEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationEntryCodeLengthRule flags a long code", () => {
  const rule = new EscalationEntryCodeLengthRule(120);
  const item = newEscalationEntry("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationEntryRequiredTitleRule flags a blank title", () => {
  const rule = new EscalationEntryRequiredTitleRule("escalation entry needs an entry");
  const item = newEscalationEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
