import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledSenderEntryView, toScheduledSenderEntryViews } from "./scheduled-sender-entry-view.js";
import { newScheduledSenderEntry } from "./scheduled-sender-entry.js";

test("ScheduledSenderEntryView shows the status in capitals", () => {
  const item = newScheduledSenderEntry("code-969", "title-457");
  const view = toScheduledSenderEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledSenderEntryViews([item, item]).length, 2, "views");
});
