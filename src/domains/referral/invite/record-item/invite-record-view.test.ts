import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteRecordView, toInviteRecordViews } from "./invite-record-view.js";
import { newInviteRecord } from "./invite-record.js";

test("InviteRecordView shows the status in capitals", () => {
  const item = newInviteRecord("code-738", "title-937");
  const view = toInviteRecordView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteRecordViews([item, item]).length, 2, "views");
});
