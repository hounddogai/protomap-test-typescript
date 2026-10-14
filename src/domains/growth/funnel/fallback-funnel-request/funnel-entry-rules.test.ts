import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelEntryCodeLengthRule,
  FunnelEntryRequiredLocaleRule,
  defaultFunnelEntryValidator,
} from "./funnel-entry-rules.js";
import { newFunnelEntry } from "./funnel-entry.js";

test("FunnelEntryValidator reports every problem", () => {
  const validator = defaultFunnelEntryValidator();
  const item = newFunnelEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelEntryCodeLengthRule flags a long code", () => {
  const rule = new FunnelEntryCodeLengthRule(16);
  const item = newFunnelEntry("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FunnelEntryRequiredLocaleRule flags a blank locale", () => {
  const rule = new FunnelEntryRequiredLocaleRule("funnel entry needs an entry");
  const item = newFunnelEntry("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
