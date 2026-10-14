import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryBranchPreferenceView, toPrimaryBranchPreferenceViews } from "./primary-branch-preference-view.js";
import { newPrimaryBranchPreference } from "./primary-branch-preference.js";

test("PrimaryBranchPreferenceView shows the status in capitals", () => {
  const item = newPrimaryBranchPreference("code-866", "name-660");
  const view = toPrimaryBranchPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryBranchPreferenceViews([item, item]).length, 2, "views");
});
