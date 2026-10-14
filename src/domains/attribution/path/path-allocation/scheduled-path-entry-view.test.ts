import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledPathEntryView, toScheduledPathEntryViews } from "./scheduled-path-entry-view.js";
import { newScheduledPathEntry } from "./scheduled-path-entry.js";

test("ScheduledPathEntryView shows the status in capitals", () => {
  const item = newScheduledPathEntry("code-703", "name-403");
  const view = toScheduledPathEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledPathEntryViews([item, item]).length, 2, "views");
});
