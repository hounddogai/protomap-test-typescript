import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPostRecordView, toFallbackPostRecordViews } from "./fallback-post-record-view.js";
import { newFallbackPostRecord } from "./fallback-post-record.js";

test("FallbackPostRecordView shows the status in capitals", () => {
  const item = newFallbackPostRecord("code-6", "label-373");
  const view = toFallbackPostRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPostRecordViews([item, item]).length, 2, "views");
});
