import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveInviteSummaryView, toAdaptiveInviteSummaryViews } from "./adaptive-invite-summary-view.js";
import { newAdaptiveInviteSummary } from "./adaptive-invite-summary.js";

test("AdaptiveInviteSummaryView shows the status in capitals", () => {
  const item = newAdaptiveInviteSummary("code-450", "title-271");
  const view = toAdaptiveInviteSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveInviteSummaryViews([item, item]).length, 2, "views");
});
