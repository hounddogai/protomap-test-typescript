import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeSnapshotView, toChallengeSnapshotViews } from "./challenge-snapshot-view.js";
import { newChallengeSnapshot } from "./challenge-snapshot.js";

test("ChallengeSnapshotView shows the status in capitals", () => {
  const item = newChallengeSnapshot("code-493", "title-413");
  const view = toChallengeSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeSnapshotViews([item, item]).length, 2, "views");
});
