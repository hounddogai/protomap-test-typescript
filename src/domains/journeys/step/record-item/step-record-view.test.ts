import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepRecordView, toStepRecordViews } from "./step-record-view.js";
import { newStepRecord } from "./step-record.js";

test("StepRecordView shows the status in capitals", () => {
  const item = newStepRecord("code-227", "name-940");
  const view = toStepRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepRecordViews([item, item]).length, 2, "views");
});
