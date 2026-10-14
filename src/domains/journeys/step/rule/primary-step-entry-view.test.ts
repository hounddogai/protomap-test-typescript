import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryStepEntryView, toPrimaryStepEntryViews } from "./primary-step-entry-view.js";
import { newPrimaryStepEntry } from "./primary-step-entry.js";

test("PrimaryStepEntryView shows the status in capitals", () => {
  const item = newPrimaryStepEntry("code-239", "name-112");
  const view = toPrimaryStepEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryStepEntryViews([item, item]).length, 2, "views");
});
