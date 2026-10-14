import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaProfileView, toSlaProfileViews } from "./sla-profile-view.js";
import { newSlaProfile } from "./sla-profile.js";

test("SlaProfileView shows the status in capitals", () => {
  const item = newSlaProfile("code-53", "name-878");
  const view = toSlaProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaProfileViews([item, item]).length, 2, "views");
});
