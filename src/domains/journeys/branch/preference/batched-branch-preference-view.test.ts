import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedBranchPreferenceView, toBatchedBranchPreferenceViews } from "./batched-branch-preference-view.js";
import { newBatchedBranchPreference } from "./batched-branch-preference.js";

test("BatchedBranchPreferenceView shows the status in capitals", () => {
  const item = newBatchedBranchPreference("code-750", "title-433");
  const view = toBatchedBranchPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedBranchPreferenceViews([item, item]).length, 2, "views");
});
