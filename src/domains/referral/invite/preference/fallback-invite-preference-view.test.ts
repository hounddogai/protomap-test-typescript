import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackInvitePreferenceView,
  toFallbackInvitePreferenceViews,
} from "./fallback-invite-preference-view.js";
import { newFallbackInvitePreference } from "./fallback-invite-preference.js";

test("FallbackInvitePreferenceView shows the status in capitals", () => {
  const item = newFallbackInvitePreference("code-213", "title-290");
  const view = toFallbackInvitePreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackInvitePreferenceViews([item, item]).length, 2, "views");
});
