import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalApprovalCheckpointView,
  toSeasonalApprovalCheckpointViews,
} from "./seasonal-approval-checkpoint-view.js";
import { newSeasonalApprovalCheckpoint } from "./seasonal-approval-checkpoint.js";

test("SeasonalApprovalCheckpointView shows the status in capitals", () => {
  const item = newSeasonalApprovalCheckpoint("code-744", "label-703");
  const view = toSeasonalApprovalCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalApprovalCheckpointViews([item, item]).length, 2, "views");
});
