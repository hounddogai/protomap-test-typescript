import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackRetentionRecordView, toFallbackRetentionRecordViews } from "./fallback-retention-record-view.js";
import { newFallbackRetentionRecord } from "./fallback-retention-record.js";

test("FallbackRetentionRecordView shows the status in capitals", () => {
  const item = newFallbackRetentionRecord("code-785", "name-732");
  const view = toFallbackRetentionRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackRetentionRecordViews([item, item]).length, 2, "views");
});
