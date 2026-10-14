import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeSummaryView, toChallengeSummaryViews } from "./challenge-summary-view.js";
import { newChallengeSummary } from "./challenge-summary.js";

test("ChallengeSummaryView shows the status in capitals", () => {
  const item = newChallengeSummary("code-561", "title-959");
  const view = toChallengeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeSummaryViews([item, item]).length, 2, "views");
});
