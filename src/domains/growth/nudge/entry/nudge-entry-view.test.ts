import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeEntryView, toNudgeEntryViews } from "./nudge-entry-view.js";
import { newNudgeEntry } from "./nudge-entry.js";

test("NudgeEntryView shows the status in capitals", () => {
  const item = newNudgeEntry("code-508", "title-39");
  const view = toNudgeEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeEntryViews([item, item]).length, 2, "views");
});
