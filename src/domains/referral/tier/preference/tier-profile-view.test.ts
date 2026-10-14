import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierProfileView, toTierProfileViews } from "./tier-profile-view.js";
import { newTierProfile } from "./tier-profile.js";

test("TierProfileView shows the status in capitals", () => {
  const item = newTierProfile("code-795", "name-582");
  const view = toTierProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierProfileViews([item, item]).length, 2, "views");
});
