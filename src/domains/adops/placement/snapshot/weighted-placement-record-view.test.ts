import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedPlacementRecordView, toWeightedPlacementRecordViews } from "./weighted-placement-record-view.js";
import { newWeightedPlacementRecord } from "./weighted-placement-record.js";

test("WeightedPlacementRecordView shows the status in capitals", () => {
  const item = newWeightedPlacementRecord("code-175", "label-437");
  const view = toWeightedPlacementRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPlacementRecordViews([item, item]).length, 2, "views");
});
