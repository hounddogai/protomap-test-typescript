import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleProfileView, toExitRuleProfileViews } from "./exit-rule-profile-view.js";
import { newExitRuleProfile } from "./exit-rule-profile.js";

test("ExitRuleProfileView shows the status in capitals", () => {
  const item = newExitRuleProfile("code-286", "label-458");
  const view = toExitRuleProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleProfileViews([item, item]).length, 2, "views");
});
