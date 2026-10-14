import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedStepEntryView, toCappedStepEntryViews } from "./capped-step-entry-view.js";
import { newCappedStepEntry } from "./capped-step-entry.js";

test("CappedStepEntryView shows the status in capitals", () => {
  const item = newCappedStepEntry("code-126", "label-792");
  const view = toCappedStepEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedStepEntryViews([item, item]).length, 2, "views");
});
