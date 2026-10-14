import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultCsatRecordView, toDefaultCsatRecordViews } from "./default-csat-record-view.js";
import { newDefaultCsatRecord } from "./default-csat-record.js";

test("DefaultCsatRecordView shows the status in capitals", () => {
  const item = newDefaultCsatRecord("code-911", "title-381");
  const view = toDefaultCsatRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultCsatRecordViews([item, item]).length, 2, "views");
});
