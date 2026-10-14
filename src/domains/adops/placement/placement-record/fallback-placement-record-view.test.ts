import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPlacementRecordView, toFallbackPlacementRecordViews } from "./fallback-placement-record-view.js";
import { newFallbackPlacementRecord } from "./fallback-placement-record.js";

test("FallbackPlacementRecordView shows the status in capitals", () => {
  const item = newFallbackPlacementRecord("code-174", "title-588");
  const view = toFallbackPlacementRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPlacementRecordViews([item, item]).length, 2, "views");
});
