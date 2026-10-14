import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentRuleView, toEnrollmentRuleViews } from "./enrollment-rule-view.js";
import { newEnrollmentRule } from "./enrollment-rule.js";

test("EnrollmentRuleView shows the status in capitals", () => {
  const item = newEnrollmentRule("code-826", "label-756");
  const view = toEnrollmentRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentRuleViews([item, item]).length, 2, "views");
});
