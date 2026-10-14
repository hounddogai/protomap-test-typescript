import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyEntryView, toJourneyEntryViews } from "./journey-entry-view.js";
import { newJourneyEntry } from "./journey-entry.js";

test("JourneyEntryView shows the status in capitals", () => {
  const item = newJourneyEntry("code-896", "label-540");
  const view = toJourneyEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyEntryViews([item, item]).length, 2, "views");
});
