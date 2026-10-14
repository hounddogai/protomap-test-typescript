import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointRecordView, toTouchpointRecordViews } from "./touchpoint-record-view.js";
import { newTouchpointRecord } from "./touchpoint-record.js";

test("TouchpointRecordView shows the status in capitals", () => {
  const item = newTouchpointRecord("code-414", "name-820");
  const view = toTouchpointRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointRecordViews([item, item]).length, 2, "views");
});
