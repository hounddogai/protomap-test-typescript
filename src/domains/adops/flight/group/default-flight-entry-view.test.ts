import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultFlightEntryView, toDefaultFlightEntryViews } from "./default-flight-entry-view.js";
import { newDefaultFlightEntry } from "./default-flight-entry.js";

test("DefaultFlightEntryView shows the status in capitals", () => {
  const item = newDefaultFlightEntry("code-776", "title-900");
  const view = toDefaultFlightEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultFlightEntryViews([item, item]).length, 2, "views");
});
