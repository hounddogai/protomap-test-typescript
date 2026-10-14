import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualOptOutProfileView, toManualOptOutProfileViews } from "./manual-opt-out-profile-view.js";
import { newManualOptOutProfile } from "./manual-opt-out-profile.js";

test("ManualOptOutProfileView shows the status in capitals", () => {
  const item = newManualOptOutProfile("code-302", "name-104");
  const view = toManualOptOutProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualOptOutProfileViews([item, item]).length, 2, "views");
});
