import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackNudgeEntryView, toFallbackNudgeEntryViews } from "./fallback-nudge-entry-view.js";
import { newFallbackNudgeEntry } from "./fallback-nudge-entry.js";

test("FallbackNudgeEntryView shows the status in capitals", () => {
  const item = newFallbackNudgeEntry("code-607", "title-836");
  const view = toFallbackNudgeEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackNudgeEntryViews([item, item]).length, 2, "views");
});
