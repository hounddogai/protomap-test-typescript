import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFrequencyRecordView, toRollingFrequencyRecordViews } from "./rolling-frequency-record-view.js";
import { newRollingFrequencyRecord } from "./rolling-frequency-record.js";

test("RollingFrequencyRecordView shows the status in capitals", () => {
  const item = newRollingFrequencyRecord("code-456", "label-7");
  const view = toRollingFrequencyRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFrequencyRecordViews([item, item]).length, 2, "views");
});
