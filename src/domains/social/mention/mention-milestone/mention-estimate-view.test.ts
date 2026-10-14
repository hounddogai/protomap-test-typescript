import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionEstimateView, toMentionEstimateViews } from "./mention-estimate-view.js";
import { newMentionEstimate } from "./mention-estimate.js";

test("MentionEstimateView shows the status in capitals", () => {
  const item = newMentionEstimate("code-437", "title-244");
  const view = toMentionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionEstimateViews([item, item]).length, 2, "views");
});
