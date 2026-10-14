import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchPreferenceView, toBranchPreferenceViews } from "./branch-preference-view.js";
import { newBranchPreference } from "./branch-preference.js";

test("BranchPreferenceView shows the status in capitals", () => {
  const item = newBranchPreference("code-268", "name-444");
  const view = toBranchPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchPreferenceViews([item, item]).length, 2, "views");
});
