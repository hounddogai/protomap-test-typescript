import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionRecordView, toConversionRecordViews } from "./conversion-record-view.js";
import { newConversionRecord } from "./conversion-record.js";

test("ConversionRecordView shows the status in capitals", () => {
  const item = newConversionRecord("code-409", "title-545");
  const view = toConversionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionRecordViews([item, item]).length, 2, "views");
});
