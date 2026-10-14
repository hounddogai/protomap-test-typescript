import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictDomainRecordView, toStrictDomainRecordViews } from "./strict-domain-record-view.js";
import { newStrictDomainRecord } from "./strict-domain-record.js";

test("StrictDomainRecordView shows the status in capitals", () => {
  const item = newStrictDomainRecord("code-146", "title-482");
  const view = toStrictDomainRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictDomainRecordViews([item, item]).length, 2, "views");
});
