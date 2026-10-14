import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedTierRecordView, toCappedTierRecordViews } from "./capped-tier-record-view.js";
import { newCappedTierRecord } from "./capped-tier-record.js";

test("CappedTierRecordView shows the status in capitals", () => {
  const item = newCappedTierRecord("code-949", "label-565");
  const view = toCappedTierRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedTierRecordViews([item, item]).length, 2, "views");
});
