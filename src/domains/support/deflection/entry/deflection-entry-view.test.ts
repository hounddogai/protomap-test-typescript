import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionEntryView, toDeflectionEntryViews } from "./deflection-entry-view.js";
import { newDeflectionEntry } from "./deflection-entry.js";

test("DeflectionEntryView shows the status in capitals", () => {
  const item = newDeflectionEntry("code-972", "title-301");
  const view = toDeflectionEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionEntryViews([item, item]).length, 2, "views");
});
