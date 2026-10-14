import assert from "node:assert/strict";
import { test } from "node:test";
import { toInvitePreferenceView, toInvitePreferenceViews } from "./invite-preference-view.js";
import { newInvitePreference } from "./invite-preference.js";

test("InvitePreferenceView shows the status in capitals", () => {
  const item = newInvitePreference("code-399", "name-424");
  const view = toInvitePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInvitePreferenceViews([item, item]).length, 2, "views");
});
