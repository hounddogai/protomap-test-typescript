import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryInviteEntryView, toPrimaryInviteEntryViews } from "./primary-invite-entry-view.js";
import { newPrimaryInviteEntry } from "./primary-invite-entry.js";

test("PrimaryInviteEntryView shows the status in capitals", () => {
  const item = newPrimaryInviteEntry("code-59", "title-421");
  const view = toPrimaryInviteEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryInviteEntryViews([item, item]).length, 2, "views");
});
