import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedChallengeSnapshotView,
  toWeightedChallengeSnapshotViews,
} from "./weighted-challenge-snapshot-view.js";
import { newWeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

test("WeightedChallengeSnapshotView shows the status in capitals", () => {
  const item = newWeightedChallengeSnapshot("code-292", "name-206");
  const view = toWeightedChallengeSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedChallengeSnapshotViews([item, item]).length, 2, "views");
});
