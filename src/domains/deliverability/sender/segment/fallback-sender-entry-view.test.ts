import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackSenderEntryView, toFallbackSenderEntryViews } from "./fallback-sender-entry-view.js";
import { newFallbackSenderEntry } from "./fallback-sender-entry.js";

test("FallbackSenderEntryView shows the status in capitals", () => {
  const item = newFallbackSenderEntry("code-659", "label-315");
  const view = toFallbackSenderEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSenderEntryViews([item, item]).length, 2, "views");
});
