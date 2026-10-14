import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeProfileView, toBadgeProfileViews } from "./badge-profile-view.js";
import { newBadgeProfile } from "./badge-profile.js";

test("BadgeProfileView shows the status in capitals", () => {
  const item = newBadgeProfile("code-997", "title-498");
  const view = toBadgeProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeProfileViews([item, item]).length, 2, "views");
});
