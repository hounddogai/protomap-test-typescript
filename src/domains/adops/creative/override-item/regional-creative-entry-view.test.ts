import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalCreativeEntryView, toRegionalCreativeEntryViews } from "./regional-creative-entry-view.js";
import { newRegionalCreativeEntry } from "./regional-creative-entry.js";

test("RegionalCreativeEntryView shows the status in capitals", () => {
  const item = newRegionalCreativeEntry("code-798", "label-446");
  const view = toRegionalCreativeEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalCreativeEntryViews([item, item]).length, 2, "views");
});
