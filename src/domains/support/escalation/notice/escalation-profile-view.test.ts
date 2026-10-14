import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationProfileView, toEscalationProfileViews } from "./escalation-profile-view.js";
import { newEscalationProfile } from "./escalation-profile.js";

test("EscalationProfileView shows the status in capitals", () => {
  const item = newEscalationProfile("code-351", "title-756");
  const view = toEscalationProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationProfileViews([item, item]).length, 2, "views");
});
