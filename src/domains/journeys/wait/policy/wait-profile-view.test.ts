import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitProfileView, toWaitProfileViews } from "./wait-profile-view.js";
import { newWaitProfile } from "./wait-profile.js";

test("WaitProfileView shows the status in capitals", () => {
  const item = newWaitProfile("code-301", "name-318");
  const view = toWaitProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitProfileViews([item, item]).length, 2, "views");
});
