import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathRecordView, toPathRecordViews } from "./path-record-view.js";
import { newPathRecord } from "./path-record.js";

test("PathRecordView shows the status in capitals", () => {
  const item = newPathRecord("code-207", "name-838");
  const view = toPathRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathRecordViews([item, item]).length, 2, "views");
});
