import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictFraudCheckCheckpointView,
  toStrictFraudCheckCheckpointViews,
} from "./strict-fraud-check-checkpoint-view.js";
import { newStrictFraudCheckCheckpoint } from "./strict-fraud-check-checkpoint.js";

test("StrictFraudCheckCheckpointView shows the status in capitals", () => {
  const item = newStrictFraudCheckCheckpoint("code-753", "name-890");
  const view = toStrictFraudCheckCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFraudCheckCheckpointViews([item, item]).length, 2, "views");
});
