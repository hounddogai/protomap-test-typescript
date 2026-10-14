import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelEntryView, toFunnelEntryViews } from "./funnel-entry-view.js";
import { newFunnelEntry } from "./funnel-entry.js";

test("FunnelEntryView shows the status in capitals", () => {
  const item = newFunnelEntry("code-751", "label-378");
  const view = toFunnelEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelEntryViews([item, item]).length, 2, "views");
});
