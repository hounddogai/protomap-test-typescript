import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingSenderEntryView, toPendingSenderEntryViews } from "./pending-sender-entry-view.js";
import { newPendingSenderEntry } from "./pending-sender-entry.js";

test("PendingSenderEntryView shows the status in capitals", () => {
  const item = newPendingSenderEntry("code-938", "label-478");
  const view = toPendingSenderEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSenderEntryViews([item, item]).length, 2, "views");
});
