import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedNudgeEntryView, toCappedNudgeEntryViews } from "./capped-nudge-entry-view.js";
import { newCappedNudgeEntry } from "./capped-nudge-entry.js";

test("CappedNudgeEntryView shows the status in capitals", () => {
  const item = newCappedNudgeEntry("code-413", "label-281");
  const view = toCappedNudgeEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedNudgeEntryViews([item, item]).length, 2, "views");
});
