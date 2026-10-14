import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintCheckpointView, toComplaintCheckpointViews } from "./complaint-checkpoint-view.js";
import { newComplaintCheckpoint } from "./complaint-checkpoint.js";

test("ComplaintCheckpointView shows the status in capitals", () => {
  const item = newComplaintCheckpoint("code-367", "name-943");
  const view = toComplaintCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintCheckpointViews([item, item]).length, 2, "views");
});
