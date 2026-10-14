import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualStepRecordView, toManualStepRecordViews } from "./manual-step-record-view.js";
import { newManualStepRecord } from "./manual-step-record.js";

test("ManualStepRecordView shows the status in capitals", () => {
  const item = newManualStepRecord("code-159", "name-94");
  const view = toManualStepRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualStepRecordViews([item, item]).length, 2, "views");
});
