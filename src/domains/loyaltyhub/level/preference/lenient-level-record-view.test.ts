import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientLevelRecordView, toLenientLevelRecordViews } from "./lenient-level-record-view.js";
import { newLenientLevelRecord } from "./lenient-level-record.js";

test("LenientLevelRecordView shows the status in capitals", () => {
  const item = newLenientLevelRecord("code-262", "name-632");
  const view = toLenientLevelRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientLevelRecordViews([item, item]).length, 2, "views");
});
