import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyEntryView, toFrequencyEntryViews } from "./frequency-entry-view.js";
import { newFrequencyEntry } from "./frequency-entry.js";

test("FrequencyEntryView shows the status in capitals", () => {
  const item = newFrequencyEntry("code-426", "label-314");
  const view = toFrequencyEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyEntryViews([item, item]).length, 2, "views");
});
