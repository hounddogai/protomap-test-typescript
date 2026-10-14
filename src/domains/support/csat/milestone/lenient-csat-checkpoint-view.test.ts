import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientCsatCheckpointView, toLenientCsatCheckpointViews } from "./lenient-csat-checkpoint-view.js";
import { newLenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

test("LenientCsatCheckpointView shows the status in capitals", () => {
  const item = newLenientCsatCheckpoint("code-411", "label-792");
  const view = toLenientCsatCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientCsatCheckpointViews([item, item]).length, 2, "views");
});
