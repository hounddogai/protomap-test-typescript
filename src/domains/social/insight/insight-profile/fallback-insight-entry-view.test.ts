import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackInsightEntryView, toFallbackInsightEntryViews } from "./fallback-insight-entry-view.js";
import { newFallbackInsightEntry } from "./fallback-insight-entry.js";

test("FallbackInsightEntryView shows the status in capitals", () => {
  const item = newFallbackInsightEntry("code-247", "title-680");
  const view = toFallbackInsightEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackInsightEntryViews([item, item]).length, 2, "views");
});
