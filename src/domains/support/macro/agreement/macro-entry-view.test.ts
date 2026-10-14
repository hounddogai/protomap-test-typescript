import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroEntryView, toMacroEntryViews } from "./macro-entry-view.js";
import { newMacroEntry } from "./macro-entry.js";

test("MacroEntryView shows the status in capitals", () => {
  const item = newMacroEntry("code-646", "name-900");
  const view = toMacroEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroEntryViews([item, item]).length, 2, "views");
});
