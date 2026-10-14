import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationEntryView, toReputationEntryViews } from "./reputation-entry-view.js";
import { newReputationEntry } from "./reputation-entry.js";

test("ReputationEntryView shows the status in capitals", () => {
  const item = newReputationEntry("code-901", "label-279");
  const view = toReputationEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationEntryViews([item, item]).length, 2, "views");
});
