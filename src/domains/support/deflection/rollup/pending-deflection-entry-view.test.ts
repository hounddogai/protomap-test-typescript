import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingDeflectionEntryView, toPendingDeflectionEntryViews } from "./pending-deflection-entry-view.js";
import { newPendingDeflectionEntry } from "./pending-deflection-entry.js";

test("PendingDeflectionEntryView shows the status in capitals", () => {
  const item = newPendingDeflectionEntry("code-705", "name-599");
  const view = toPendingDeflectionEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingDeflectionEntryViews([item, item]).length, 2, "views");
});
