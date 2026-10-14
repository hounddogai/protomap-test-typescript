import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowEntryView, toWindowEntryViews } from "./window-entry-view.js";
import { newWindowEntry } from "./window-entry.js";

test("WindowEntryView shows the status in capitals", () => {
  const item = newWindowEntry("code-496", "name-967");
  const view = toWindowEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowEntryViews([item, item]).length, 2, "views");
});
