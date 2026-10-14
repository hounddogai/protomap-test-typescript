import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedLevelEntryView, toBatchedLevelEntryViews } from "./batched-level-entry-view.js";
import { newBatchedLevelEntry } from "./batched-level-entry.js";

test("BatchedLevelEntryView shows the status in capitals", () => {
  const item = newBatchedLevelEntry("code-792", "name-116");
  const view = toBatchedLevelEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedLevelEntryViews([item, item]).length, 2, "views");
});
