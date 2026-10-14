import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortCheckpointView, toCohortCheckpointViews } from "./cohort-checkpoint-view.js";
import { newCohortCheckpoint } from "./cohort-checkpoint.js";

test("CohortCheckpointView shows the status in capitals", () => {
  const item = newCohortCheckpoint("code-361", "name-432");
  const view = toCohortCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortCheckpointViews([item, item]).length, 2, "views");
});
