import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortEntryView, toCohortEntryViews } from "./cohort-entry-view.js";
import { newCohortEntry } from "./cohort-entry.js";

test("CohortEntryView shows the status in capitals", () => {
  const item = newCohortEntry("code-298", "label-676");
  const view = toCohortEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortEntryViews([item, item]).length, 2, "views");
});
