import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultInviteEntryView, toDefaultInviteEntryViews } from "./default-invite-entry-view.js";
import { newDefaultInviteEntry } from "./default-invite-entry.js";

test("DefaultInviteEntryView shows the status in capitals", () => {
  const item = newDefaultInviteEntry("code-636", "name-966");
  const view = toDefaultInviteEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultInviteEntryViews([item, item]).length, 2, "views");
});
