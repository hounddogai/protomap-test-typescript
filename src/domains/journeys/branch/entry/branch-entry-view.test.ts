import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchEntryView, toBranchEntryViews } from "./branch-entry-view.js";
import { newBranchEntry } from "./branch-entry.js";

test("BranchEntryView shows the status in capitals", () => {
  const item = newBranchEntry("code-828", "name-888");
  const view = toBranchEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchEntryViews([item, item]).length, 2, "views");
});
