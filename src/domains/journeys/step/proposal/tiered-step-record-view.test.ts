import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredStepRecordView, toTieredStepRecordViews } from "./tiered-step-record-view.js";
import { newTieredStepRecord } from "./tiered-step-record.js";

test("TieredStepRecordView shows the status in capitals", () => {
  const item = newTieredStepRecord("code-678", "label-299");
  const view = toTieredStepRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredStepRecordViews([item, item]).length, 2, "views");
});
