import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultFrequencyRecordView, toDefaultFrequencyRecordViews } from "./default-frequency-record-view.js";
import { newDefaultFrequencyRecord } from "./default-frequency-record.js";

test("DefaultFrequencyRecordView shows the status in capitals", () => {
  const item = newDefaultFrequencyRecord("code-320", "label-560");
  const view = toDefaultFrequencyRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultFrequencyRecordViews([item, item]).length, 2, "views");
});
