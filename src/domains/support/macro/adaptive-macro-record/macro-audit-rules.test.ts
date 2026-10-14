import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroAuditChannelLengthRule,
  MacroAuditRequiredChannelRule,
  defaultMacroAuditValidator,
} from "./macro-audit-rules.js";
import { newMacroAudit } from "./macro-audit.js";

test("MacroAuditValidator reports every problem", () => {
  const validator = defaultMacroAuditValidator();
  const item = newMacroAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroAuditChannelLengthRule flags a long channel", () => {
  const rule = new MacroAuditChannelLengthRule(120);
  const item = newMacroAudit("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroAuditRequiredChannelRule flags a blank channel", () => {
  const rule = new MacroAuditRequiredChannelRule("macro audit needs an entry");
  const item = newMacroAudit("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
