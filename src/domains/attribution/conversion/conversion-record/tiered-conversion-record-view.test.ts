import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredConversionRecordView, toTieredConversionRecordViews } from "./tiered-conversion-record-view.js";
import { newTieredConversionRecord } from "./tiered-conversion-record.js";

test("TieredConversionRecordView shows the status in capitals", () => {
  const item = newTieredConversionRecord("code-785", "name-947");
  const view = toTieredConversionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredConversionRecordViews([item, item]).length, 2, "views");
});
