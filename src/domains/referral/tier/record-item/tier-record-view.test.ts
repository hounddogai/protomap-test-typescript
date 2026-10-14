import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierRecordView, toTierRecordViews } from "./tier-record-view.js";
import { newTierRecord } from "./tier-record.js";

test("TierRecordView shows the status in capitals", () => {
  const item = newTierRecord("code-985", "label-777");
  const view = toTierRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierRecordViews([item, item]).length, 2, "views");
});
