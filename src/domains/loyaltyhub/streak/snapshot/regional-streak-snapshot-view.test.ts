import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalStreakSnapshotView, toRegionalStreakSnapshotViews } from "./regional-streak-snapshot-view.js";
import { newRegionalStreakSnapshot } from "./regional-streak-snapshot.js";

test("RegionalStreakSnapshotView shows the status in capitals", () => {
  const item = newRegionalStreakSnapshot("code-912", "title-183");
  const view = toRegionalStreakSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalStreakSnapshotViews([item, item]).length, 2, "views");
});
