import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationEntryView, toEscalationEntryViews } from "./escalation-entry-view.js";
import { newEscalationEntry } from "./escalation-entry.js";

test("EscalationEntryView shows the status in capitals", () => {
  const item = newEscalationEntry("code-927", "name-789");
  const view = toEscalationEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationEntryViews([item, item]).length, 2, "views");
});
