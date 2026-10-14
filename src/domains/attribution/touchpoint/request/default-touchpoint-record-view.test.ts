import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultTouchpointRecordView, toDefaultTouchpointRecordViews } from "./default-touchpoint-record-view.js";
import { newDefaultTouchpointRecord } from "./default-touchpoint-record.js";

test("DefaultTouchpointRecordView shows the status in capitals", () => {
  const item = newDefaultTouchpointRecord("code-590", "title-921");
  const view = toDefaultTouchpointRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultTouchpointRecordViews([item, item]).length, 2, "views");
});
