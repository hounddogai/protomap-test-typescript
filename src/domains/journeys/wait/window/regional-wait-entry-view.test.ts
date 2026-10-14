import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalWaitEntryView, toRegionalWaitEntryViews } from "./regional-wait-entry-view.js";
import { newRegionalWaitEntry } from "./regional-wait-entry.js";

test("RegionalWaitEntryView shows the status in capitals", () => {
  const item = newRegionalWaitEntry("code-220", "label-2");
  const view = toRegionalWaitEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalWaitEntryViews([item, item]).length, 2, "views");
});
