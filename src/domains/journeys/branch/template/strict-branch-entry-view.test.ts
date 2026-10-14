import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBranchEntryView, toStrictBranchEntryViews } from "./strict-branch-entry-view.js";
import { newStrictBranchEntry } from "./strict-branch-entry.js";

test("StrictBranchEntryView shows the status in capitals", () => {
  const item = newStrictBranchEntry("code-65", "label-149");
  const view = toStrictBranchEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBranchEntryViews([item, item]).length, 2, "views");
});
