import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatEntryView, toCsatEntryViews } from "./csat-entry-view.js";
import { newCsatEntry } from "./csat-entry.js";

test("CsatEntryView shows the status in capitals", () => {
  const item = newCsatEntry("code-747", "label-593");
  const view = toCsatEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatEntryViews([item, item]).length, 2, "views");
});
