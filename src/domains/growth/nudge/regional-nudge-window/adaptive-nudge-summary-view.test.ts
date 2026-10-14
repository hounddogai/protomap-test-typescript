import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveNudgeSummaryView, toAdaptiveNudgeSummaryViews } from "./adaptive-nudge-summary-view.js";
import { newAdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

test("AdaptiveNudgeSummaryView shows the status in capitals", () => {
  const item = newAdaptiveNudgeSummary("code-41", "title-542");
  const view = toAdaptiveNudgeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveNudgeSummaryViews([item, item]).length, 2, "views");
});
