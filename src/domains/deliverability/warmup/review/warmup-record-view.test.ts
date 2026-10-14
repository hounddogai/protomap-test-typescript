import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupRecordView, toWarmupRecordViews } from "./warmup-record-view.js";
import { newWarmupRecord } from "./warmup-record.js";

test("WarmupRecordView shows the status in capitals", () => {
  const item = newWarmupRecord("code-841", "name-115");
  const view = toWarmupRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupRecordViews([item, item]).length, 2, "views");
});
