import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelRecordView, toModelRecordViews } from "./model-record-view.js";
import { newModelRecord } from "./model-record.js";

test("ModelRecordView shows the status in capitals", () => {
  const item = newModelRecord("code-910", "name-264");
  const view = toModelRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelRecordViews([item, item]).length, 2, "views");
});
