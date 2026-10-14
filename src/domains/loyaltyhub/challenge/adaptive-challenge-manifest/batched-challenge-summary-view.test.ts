import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedChallengeSummaryView, toBatchedChallengeSummaryViews } from "./batched-challenge-summary-view.js";
import { newBatchedChallengeSummary } from "./batched-challenge-summary.js";

test("BatchedChallengeSummaryView shows the status in capitals", () => {
  const item = newBatchedChallengeSummary("code-32", "title-793");
  const view = toBatchedChallengeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedChallengeSummaryViews([item, item]).length, 2, "views");
});
