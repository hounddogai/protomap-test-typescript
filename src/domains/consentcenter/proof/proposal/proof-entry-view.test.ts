import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofEntryView, toProofEntryViews } from "./proof-entry-view.js";
import { newProofEntry } from "./proof-entry.js";

test("ProofEntryView shows the status in capitals", () => {
  const item = newProofEntry("code-417", "title-665");
  const view = toProofEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofEntryViews([item, item]).length, 2, "views");
});
