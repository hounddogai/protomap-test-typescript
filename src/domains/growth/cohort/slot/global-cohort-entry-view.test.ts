import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalCohortEntryView, toGlobalCohortEntryViews } from "./global-cohort-entry-view.js";
import { newGlobalCohortEntry } from "./global-cohort-entry.js";

test("GlobalCohortEntryView shows the status in capitals", () => {
  const item = newGlobalCohortEntry("code-95", "name-476");
  const view = toGlobalCohortEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalCohortEntryViews([item, item]).length, 2, "views");
});
