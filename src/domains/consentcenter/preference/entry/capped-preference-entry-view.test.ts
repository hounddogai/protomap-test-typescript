import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedPreferenceEntryView, toCappedPreferenceEntryViews } from "./capped-preference-entry-view.js";
import { newCappedPreferenceEntry } from "./capped-preference-entry.js";

test("CappedPreferenceEntryView shows the status in capitals", () => {
  const item = newCappedPreferenceEntry("code-409", "label-225");
  const view = toCappedPreferenceEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedPreferenceEntryViews([item, item]).length, 2, "views");
});
