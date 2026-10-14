import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackSenderProfileView, toFallbackSenderProfileViews } from "./fallback-sender-profile-view.js";
import { newFallbackSenderProfile } from "./fallback-sender-profile.js";

test("FallbackSenderProfileView shows the status in capitals", () => {
  const item = newFallbackSenderProfile("code-530", "label-720");
  const view = toFallbackSenderProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSenderProfileViews([item, item]).length, 2, "views");
});
