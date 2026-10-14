import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalOptOutCheckpointView,
  toRegionalOptOutCheckpointViews,
} from "./regional-opt-out-checkpoint-view.js";
import { newRegionalOptOutCheckpoint } from "./regional-opt-out-checkpoint.js";

test("RegionalOptOutCheckpointView shows the status in capitals", () => {
  const item = newRegionalOptOutCheckpoint("code-136", "label-421");
  const view = toRegionalOptOutCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalOptOutCheckpointViews([item, item]).length, 2, "views");
});
