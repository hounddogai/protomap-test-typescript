import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedSenderProfileView, toCappedSenderProfileViews } from "./capped-sender-profile-view.js";
import { newCappedSenderProfile } from "./capped-sender-profile.js";

test("CappedSenderProfileView shows the status in capitals", () => {
  const item = newCappedSenderProfile("code-548", "name-240");
  const view = toCappedSenderProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedSenderProfileViews([item, item]).length, 2, "views");
});
