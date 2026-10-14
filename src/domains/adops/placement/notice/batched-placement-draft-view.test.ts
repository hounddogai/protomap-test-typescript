import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPlacementDraftView, toBatchedPlacementDraftViews } from "./batched-placement-draft-view.js";
import { newBatchedPlacementDraft } from "./batched-placement-draft.js";

test("BatchedPlacementDraftView shows the status in capitals", () => {
  const item = newBatchedPlacementDraft("code-566", "label-801");
  const view = toBatchedPlacementDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPlacementDraftViews([item, item]).length, 2, "views");
});
