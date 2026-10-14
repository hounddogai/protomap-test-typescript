import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedCsatEntryView, toBatchedCsatEntryViews } from "./batched-csat-entry-view.js";
import { newBatchedCsatEntry } from "./batched-csat-entry.js";

test("BatchedCsatEntryView shows the status in capitals", () => {
  const item = newBatchedCsatEntry("code-134", "title-856");
  const view = toBatchedCsatEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedCsatEntryViews([item, item]).length, 2, "views");
});
