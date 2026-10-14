import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedReplySnapshotView, toWeightedReplySnapshotViews } from "./weighted-reply-snapshot-view.js";
import { newWeightedReplySnapshot } from "./weighted-reply-snapshot.js";

test("WeightedReplySnapshotView shows the status in capitals", () => {
  const item = newWeightedReplySnapshot("code-781", "name-646");
  const view = toWeightedReplySnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedReplySnapshotViews([item, item]).length, 2, "views");
});
