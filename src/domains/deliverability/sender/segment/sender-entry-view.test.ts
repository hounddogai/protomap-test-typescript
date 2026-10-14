import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderEntryView, toSenderEntryViews } from "./sender-entry-view.js";
import { newSenderEntry } from "./sender-entry.js";

test("SenderEntryView shows the status in capitals", () => {
  const item = newSenderEntry("code-731", "label-500");
  const view = toSenderEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderEntryViews([item, item]).length, 2, "views");
});
