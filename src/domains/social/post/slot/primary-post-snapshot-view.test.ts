import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPostSnapshotView, toPrimaryPostSnapshotViews } from "./primary-post-snapshot-view.js";
import { newPrimaryPostSnapshot } from "./primary-post-snapshot.js";

test("PrimaryPostSnapshotView shows the status in capitals", () => {
  const item = newPrimaryPostSnapshot("code-540", "label-507");
  const view = toPrimaryPostSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPostSnapshotViews([item, item]).length, 2, "views");
});
