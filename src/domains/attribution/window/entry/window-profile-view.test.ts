import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowProfileView, toWindowProfileViews } from "./window-profile-view.js";
import { newWindowProfile } from "./window-profile.js";

test("WindowProfileView shows the status in capitals", () => {
  const item = newWindowProfile("code-513", "name-29");
  const view = toWindowProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowProfileViews([item, item]).length, 2, "views");
});
