import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationRecordView, toActivationRecordViews } from "./activation-record-view.js";
import { newActivationRecord } from "./activation-record.js";

test("ActivationRecordView shows the status in capitals", () => {
  const item = newActivationRecord("code-768", "name-340");
  const view = toActivationRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationRecordViews([item, item]).length, 2, "views");
});
