import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatCheckpointView, toCsatCheckpointViews } from "./csat-checkpoint-view.js";
import { newCsatCheckpoint } from "./csat-checkpoint.js";

test("CsatCheckpointView shows the status in capitals", () => {
  const item = newCsatCheckpoint("code-722", "name-2");
  const view = toCsatCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatCheckpointViews([item, item]).length, 2, "views");
});
