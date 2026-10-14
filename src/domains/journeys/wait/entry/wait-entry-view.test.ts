import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitEntryView, toWaitEntryViews } from "./wait-entry-view.js";
import { newWaitEntry } from "./wait-entry.js";

test("WaitEntryView shows the status in capitals", () => {
  const item = newWaitEntry("code-273", "title-889");
  const view = toWaitEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitEntryViews([item, item]).length, 2, "views");
});
