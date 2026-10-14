import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeSnapshotView, toCreativeSnapshotViews } from "./creative-snapshot-view.js";
import { newCreativeSnapshot } from "./creative-snapshot.js";

test("CreativeSnapshotView shows the status in capitals", () => {
  const item = newCreativeSnapshot("code-332", "label-105");
  const view = toCreativeSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeSnapshotViews([item, item]).length, 2, "views");
});
