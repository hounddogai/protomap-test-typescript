import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutProfileView, toOptOutProfileViews } from "./opt-out-profile-view.js";
import { newOptOutProfile } from "./opt-out-profile.js";

test("OptOutProfileView shows the status in capitals", () => {
  const item = newOptOutProfile("code-57", "title-7");
  const view = toOptOutProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutProfileViews([item, item]).length, 2, "views");
});
