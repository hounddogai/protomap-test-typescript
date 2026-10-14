import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledDomainRecordView, toScheduledDomainRecordViews } from "./scheduled-domain-record-view.js";
import { newScheduledDomainRecord } from "./scheduled-domain-record.js";

test("ScheduledDomainRecordView shows the status in capitals", () => {
  const item = newScheduledDomainRecord("code-914", "title-216");
  const view = toScheduledDomainRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledDomainRecordViews([item, item]).length, 2, "views");
});
