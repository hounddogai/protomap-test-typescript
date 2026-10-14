import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredChallengeSummaryView, toTieredChallengeSummaryViews } from "./tiered-challenge-summary-view.js";
import { newTieredChallengeSummary } from "./tiered-challenge-summary.js";

test("TieredChallengeSummaryView shows the status in capitals", () => {
  const item = newTieredChallengeSummary("code-762", "label-577");
  const view = toTieredChallengeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredChallengeSummaryViews([item, item]).length, 2, "views");
});
