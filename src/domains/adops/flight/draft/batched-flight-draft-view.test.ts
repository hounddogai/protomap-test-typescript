import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFlightDraftView, toBatchedFlightDraftViews } from "./batched-flight-draft-view.js";
import { newBatchedFlightDraft } from "./batched-flight-draft.js";

test("BatchedFlightDraftView shows the status in capitals", () => {
  const item = newBatchedFlightDraft("code-918", "title-478");
  const view = toBatchedFlightDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFlightDraftViews([item, item]).length, 2, "views");
});
