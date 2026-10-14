import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveTierRecordView, toAdaptiveTierRecordViews } from "./adaptive-tier-record-view.js";
import { newAdaptiveTierRecord } from "./adaptive-tier-record.js";

test("AdaptiveTierRecordView shows the status in capitals", () => {
  const item = newAdaptiveTierRecord("code-97", "title-101");
  const view = toAdaptiveTierRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveTierRecordViews([item, item]).length, 2, "views");
});
