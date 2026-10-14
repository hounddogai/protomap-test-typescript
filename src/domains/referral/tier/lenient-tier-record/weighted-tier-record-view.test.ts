import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedTierRecordView, toWeightedTierRecordViews } from "./weighted-tier-record-view.js";
import { newWeightedTierRecord } from "./weighted-tier-record.js";

test("WeightedTierRecordView shows the status in capitals", () => {
  const item = newWeightedTierRecord("code-557", "name-184");
  const view = toWeightedTierRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedTierRecordViews([item, item]).length, 2, "views");
});
