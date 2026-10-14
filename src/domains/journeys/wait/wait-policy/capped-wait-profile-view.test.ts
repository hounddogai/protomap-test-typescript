import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedWaitProfileView, toCappedWaitProfileViews } from "./capped-wait-profile-view.js";
import { newCappedWaitProfile } from "./capped-wait-profile.js";

test("CappedWaitProfileView shows the status in capitals", () => {
  const item = newCappedWaitProfile("code-857", "name-220");
  const view = toCappedWaitProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedWaitProfileViews([item, item]).length, 2, "views");
});
