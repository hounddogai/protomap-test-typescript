import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceRecordView, toBounceRecordViews } from "./bounce-record-view.js";
import { newBounceRecord } from "./bounce-record.js";

test("BounceRecordView shows the status in capitals", () => {
  const item = newBounceRecord("code-343", "label-218");
  const view = toBounceRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceRecordViews([item, item]).length, 2, "views");
});
