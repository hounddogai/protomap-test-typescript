import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualDoubleOptInEntryView, toManualDoubleOptInEntryViews } from "./manual-double-opt-in-entry-view.js";
import { newManualDoubleOptInEntry } from "./manual-double-opt-in-entry.js";

test("ManualDoubleOptInEntryView shows the status in capitals", () => {
  const item = newManualDoubleOptInEntry("code-100", "title-871");
  const view = toManualDoubleOptInEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualDoubleOptInEntryViews([item, item]).length, 2, "views");
});
