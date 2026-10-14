import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFunnelPreferenceView, toBatchedFunnelPreferenceViews } from "./batched-funnel-preference-view.js";
import { newBatchedFunnelPreference } from "./batched-funnel-preference.js";

test("BatchedFunnelPreferenceView shows the status in capitals", () => {
  const item = newBatchedFunnelPreference("code-255", "title-473");
  const view = toBatchedFunnelPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFunnelPreferenceViews([item, item]).length, 2, "views");
});
