import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFrequencyEntryView, toCappedFrequencyEntryViews } from "./capped-frequency-entry-view.js";
import { newCappedFrequencyEntry } from "./capped-frequency-entry.js";

test("CappedFrequencyEntryView shows the status in capitals", () => {
  const item = newCappedFrequencyEntry("code-249", "name-520");
  const view = toCappedFrequencyEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFrequencyEntryViews([item, item]).length, 2, "views");
});
