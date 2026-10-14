import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelProfileView, toFunnelProfileViews } from "./funnel-profile-view.js";
import { newFunnelProfile } from "./funnel-profile.js";

test("FunnelProfileView shows the status in capitals", () => {
  const item = newFunnelProfile("code-114", "title-925");
  const view = toFunnelProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelProfileViews([item, item]).length, 2, "views");
});
