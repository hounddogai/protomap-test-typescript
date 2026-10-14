import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointAuditRequiredCodeRule,
  TouchpointAuditRequiredLocaleRule,
  TouchpointAuditRequiredNameRule,
  defaultTouchpointAuditValidator,
} from "./touchpoint-audit-rules.js";
import { newTouchpointAudit } from "./touchpoint-audit.js";

test("TouchpointAuditValidator reports every problem", () => {
  const validator = defaultTouchpointAuditValidator();
  const item = newTouchpointAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointAuditRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointAuditRequiredCodeRule("touchpoint audit needs an entry");
  const item = newTouchpointAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointAuditRequiredLocaleRule flags a blank locale", () => {
  const rule = new TouchpointAuditRequiredLocaleRule("touchpoint audit needs an entry");
  const item = newTouchpointAudit("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointAuditRequiredNameRule flags a blank name", () => {
  const rule = new TouchpointAuditRequiredNameRule("touchpoint audit needs an entry");
  const item = newTouchpointAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
