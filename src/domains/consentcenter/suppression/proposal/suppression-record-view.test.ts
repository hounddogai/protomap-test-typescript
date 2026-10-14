import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionRecordView, toSuppressionRecordViews } from "./suppression-record-view.js";
import { newSuppressionRecord } from "./suppression-record.js";

test("SuppressionRecordView shows the status in capitals", () => {
  const item = newSuppressionRecord("code-929", "title-586");
  const view = toSuppressionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionRecordViews([item, item]).length, 2, "views");
});
